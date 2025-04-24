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
						name: 'Admin Created/Updated',
						value: 'admin_save',
						description: 'Triggered when an admin is created or updated',
					},
					{
						name: 'Admin Deleted',
						value: 'admin_delete',
						description: 'Triggered when an admin is deleted',
					},
					{
						name: 'Appointment Created/Updated',
						value: 'appointment_save',
						description: 'Triggered when an appointment is created or updated',
					},
					{
						name: 'Appointment Deleted',
						value: 'appointment_delete',
						description: 'Triggered when an appointment is deleted',
					},
					{
						name: 'Blocked Period Created/Updated',
						value: 'blocked_period_save',
						description: 'Triggered when a blocked period is created or updated',
					},
					{
						name: 'Blocked Period Deleted',
						value: 'blocked_period_delete',
						description: 'Triggered when a blocked period is deleted',
					},
					{
						name: 'Customer Created/Updated',
						value: 'customer_save',
						description: 'Triggered when a customer is created or updated',
					},
					{
						name: 'Customer Deleted',
						value: 'customer_delete',
						description: 'Triggered when a customer is deleted',
					},
					{
						name: 'Provider Created/Updated',
						value: 'provider_save',
						description: 'Triggered when a provider is created or updated',
					},
					{
						name: 'Provider Deleted',
						value: 'provider_delete',
						description: 'Triggered when a provider is deleted',
					},
					{
						name: 'Secretary Created/Updated',
						value: 'secretary_save',
						description: 'Triggered when a secretary is created or updated',
					},
					{
						name: 'Secretary Deleted',
						value: 'secretary_delete',
						description: 'Triggered when a secretary is deleted',
					},
					{
						name: 'Service Created/Updated',
						value: 'service_save',
						description: 'Triggered when a service is created or updated',
					},
					{
						name: 'Service Deleted',
						value: 'service_delete',
						description: 'Triggered when a service is deleted',
					},
					{
						name: 'Service Category Created/Updated',
						value: 'service_category_save',
						description: 'Triggered when a service category is created or updated',
					},
					{
						name: 'Service Category Deleted',
						value: 'service_category_delete',
						description: 'Triggered when a service category is deleted',
					},
					{
						name: 'Unavailability Created/Updated',
						value: 'unavailability_save',
						description: 'Triggered when an unavailability is created or updated',
					},
					{
						name: 'Unavailability Deleted',
						value: 'unavailability_delete',
						description: 'Triggered when an unavailability is deleted',
					},
				],
				default: 'appointment_save',
				required: true,
				description: 'The event to listen to',
			},
			{
				displayName: 'Webhook Name',
				name: 'webhookName',
				type: 'string',
				default: 'n8n-hook',
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

				this.logger.debug('Checking if Easy!Appointments webhook exists', { 
					webhookName,
					webhookUrl,
				});

				try {
					// Get all webhooks
					const webhooks = await easyAppointmentsApiRequestAllItems.call(this, 'GET', '/webhooks');
					
					this.logger.debug('Retrieved existing webhooks', { 
						count: webhooks.length,
						webhooks,
					});

					// Check if webhook exists
					for (const webhook of webhooks) {
						if (webhook.name === webhookName && webhook.url === webhookUrl) {
							// Save webhook ID for later use
							const webhookData = this.getWorkflowStaticData('node');
							webhookData.webhookId = webhook.id;
							this.logger.debug('Found existing webhook', { webhookId: webhook.id });
							return true;
						}
					}
					
					this.logger.debug('No matching webhook found');
				} catch (error) {
					this.logger.error('Error checking for existing webhooks', { error });
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
					name: webhookName + ' - ' + event,
					url: webhookUrl,
					actions: event,
					secretToken,
					isSslVerified: verifySSL,
				};

				// Log the webhook creation request for debugging
				this.logger.debug('Creating Easy!Appointments webhook', { 
					webhookName,
					webhookUrl,
					event,
					body,
				});

				try {
					const webhook = await easyAppointmentsApiRequest.call(this, 'POST', '/webhooks', body);

					if (webhook.id === undefined) {
						this.logger.error('Webhook creation failed - no ID returned', { webhook });
						throw new NodeApiError(this.getNode(), webhook, {
							message: 'Webhook creation failed - no ID returned',
						});
					}

					// Save webhook ID for later use
					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookId = webhook.id;
					this.logger.debug('Webhook created successfully', { webhookId: webhook.id });

					return true;
				} catch (error) {
					this.logger.error('Error creating webhook', { error });
					throw error;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {
					this.logger.debug('Deleting Easy!Appointments webhook', { webhookId: webhookData.webhookId });
					
					try {
						await easyAppointmentsApiRequest.call(
							this,
							'DELETE',
							`/webhooks/${webhookData.webhookId}`,
						);
						this.logger.debug('Webhook deleted successfully');
					} catch (error) {
						this.logger.error('Error deleting webhook', { error, webhookId: webhookData.webhookId });
						return false;
					}

					delete webhookData.webhookId;
				} else {
					this.logger.debug('No webhook ID found to delete');
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const headerData = this.getHeaderData() as IDataObject;
		const secretToken = this.getNodeParameter('secretToken') as string;

		this.logger.debug('Received webhook request', { 
			headers: headerData,
			body: bodyData,
		});

		// Validate secret token if provided
		if (secretToken && headerData['x-ea-signature'] !== secretToken) {
			this.logger.warn('Webhook request rejected: Invalid signature', {
				expected: secretToken,
				received: headerData['x-ea-signature'],
			});
			// Return unauthorized if the signature doesn't match
			return {
				// Return empty response
				workflowData: [],
			};
		}

		this.logger.debug('Webhook request accepted');
		return {
			// Return empty 200 response for successful delivery
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	}
}
