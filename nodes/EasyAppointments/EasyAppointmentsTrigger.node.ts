import {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeApiError,
} from 'n8n-workflow';

import { easyAppointmentsApiRequest, easyAppointmentsApiRequestAllItems } from './GenericFunctions';

export class EasyAppointmentsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Easy!Appointments Trigger',
		name: 'easyAppointmentsTrigger',
		icon: 'file:icon.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Handle Easy!Appointments webhook events',
		defaults: {
			name: 'Easy!Appointments Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'easyAppointmentsApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Appointment Created',
						value: 'appointment_create',
						description: 'Triggered when an appointment is created',
					},
					{
						name: 'Appointment Deleted',
						value: 'appointment_delete',
						description: 'Triggered when an appointment is deleted',
					},
					{
						name: 'Appointment Updated',
						value: 'appointment_update',
						description: 'Triggered when an appointment is updated',
					},
					{
						name: 'Customer Created',
						value: 'customer_create',
						description: 'Triggered when a customer is created',
					},
					{
						name: 'Customer Deleted',
						value: 'customer_delete',
						description: 'Triggered when a customer is deleted',
					},
					{
						name: 'Customer Updated',
						value: 'customer_update',
						description: 'Triggered when a customer is updated',
					},
					{
						name: 'Provider Created',
						value: 'provider_create',
						description: 'Triggered when a provider is created',
					},
					{
						name: 'Provider Deleted',
						value: 'provider_delete',
						description: 'Triggered when a provider is deleted',
					},
					{
						name: 'Provider Updated',
						value: 'provider_update',
						description: 'Triggered when a provider is updated',
					},
					{
						name: 'Service Created',
						value: 'service_create',
						description: 'Triggered when a service is created',
					},
					{
						name: 'Service Deleted',
						value: 'service_delete',
						description: 'Triggered when a service is deleted',
					},
					{
						name: 'Service Updated',
						value: 'service_update',
						description: 'Triggered when a service is updated',
					},
				],
				default: 'appointment_create',
				required: true,
				description: 'The event to listen to',
			},
			{
				displayName: 'Webhook Name',
				name: 'webhookName',
				type: 'string',
				default: 'n8n-webhook',
				required: true,
				description: 'The name of the webhook in Easy!Appointments',
			},
			{
				displayName: 'Secret Token',
				name: 'secretToken',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'The secret token to validate webhook requests',
			},
			{
				displayName: 'Verify SSL',
				name: 'verifySSL',
				type: 'boolean',
				default: true,
				description: 'Whether to verify SSL certificates for the webhook URL',
			},
		],
	};

	// @ts-ignore
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookName = this.getNodeParameter('webhookName') as string;

				try {
					// Get all webhooks
					const webhooks = await easyAppointmentsApiRequestAllItems.call(this, 'GET', '/webhooks');

					// Check if webhook exists
					for (const webhook of webhooks) {
						if (webhook.name === webhookName && webhook.url === webhookUrl) {
							// Save webhook ID for later use
							const webhookData = this.getWorkflowStaticData('node');
							webhookData.webhookId = webhook.id;
							return true;
						}
					}
				} catch (error) {
					if (error.response && error.response.status === 404) {
						return false;
					}
					throw error;
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookName = this.getNodeParameter('webhookName') as string;
				const event = this.getNodeParameter('event') as string;
				const secretToken = this.getNodeParameter('secretToken') as string;
				const verifySSL = this.getNodeParameter('verifySSL') as boolean;

				const body: IDataObject = {
					name: webhookName,
					url: webhookUrl,
					actions: event,
					secretToken,
					isSslVerified: verifySSL,
				};

				try {
					const webhook = await easyAppointmentsApiRequest.call(this, 'POST', '/webhooks', body);

					if (webhook.id === undefined) {
						throw new NodeApiError(this.getNode(), webhook, {
							message: 'Webhook creation failed',
						});
					}

					// Save webhook ID for later use
					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookId = webhook.id;

					return true;
				} catch (error) {
					throw error;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {
					try {
						await easyAppointmentsApiRequest.call(
							this,
							'DELETE',
							`/webhooks/${webhookData.webhookId}`,
						);
					} catch (error) {
						return false;
					}

					delete webhookData.webhookId;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const headerData = this.getHeaderData() as IDataObject;
		const secretToken = this.getNodeParameter('secretToken') as string;

		// Validate secret token if provided
		if (secretToken && headerData['x-ea-signature'] !== secretToken) {
			// Return unauthorized if the signature doesn't match
			return {
				// Return empty response
				workflowData: [],
			};
		}

		return {
			// Return empty 200 response for successful delivery
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	}
}
