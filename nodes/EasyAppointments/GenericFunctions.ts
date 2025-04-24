import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
	NodeApiError,
} from 'n8n-workflow';

// Type for functions that can make API requests
export type EasyAppointmentsApiFunctions = IExecuteFunctions | IHookFunctions;

/**
 * Make an API request to Easy!Appointments
 */
export async function easyAppointmentsApiRequest(
	this: EasyAppointmentsApiFunctions,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	// Credentials are handled by the httpRequestWithAuthentication helper
	const options: IHttpRequestOptions = {
		method,
		body,
		qs,
		url: '',
		json: true,
	};

	// Ensure endpoint starts with a slash
	if (!endpoint.startsWith('/')) {
		endpoint = `/${endpoint}`;
	}

	// Set the endpoint as the url path
	options.url = endpoint;

	if (!Object.keys(body).length) {
		delete options.body;
	}

	if (!Object.keys(qs).length) {
		delete options.qs;
	}

	const credentials = await this.getCredentials('easyAppointmentsApi');
	let baseUrl = credentials.baseUrl as string;

	// remove trailing slash from baseUrl if it exists
	if (baseUrl.endsWith('/')) {
		baseUrl = baseUrl.slice(0, -1);
	}
	options.url = `${baseUrl}${options.url}`;

	try {
		const result = await this.helpers.httpRequestWithAuthentication.call(this, 'easyAppointmentsApi', options);
		this.logger.debug('Easy!Appointments API request successful');
		return result;
	} catch (error) {
		this.logger.error('Easy!Appointments API request failed', { error });
		throw new NodeApiError(this.getNode(), error);
	}
}

/**
 * Make an API request to Easy!Appointments and return all results
 */
export async function easyAppointmentsApiRequestAllItems(
	this: EasyAppointmentsApiFunctions,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any> {
	const returnData: IDataObject[] = [];

	let responseData;
	qs.page = 1;
	qs.length = 100;

	do {
		responseData = await easyAppointmentsApiRequest.call(this, method, endpoint, body, qs);
		returnData.push.apply(returnData, responseData);
		qs.page++;
	} while (responseData.length === qs.length);

	return returnData;
}

/**
 * Create a resource in Easy!Appointments
 */
export async function createResource(
	this: IExecuteFunctions,
	itemIndex: number,
	endpoint: string,
	fields: string[],
): Promise<INodeExecutionData[]> {
	const body: IDataObject = {};

	for (const field of fields) {
		const value = this.getNodeParameter(field, itemIndex, '') as string;
		if (value !== '') {
			body[field] = value;
		}
	}

	const responseData = await easyAppointmentsApiRequest.call(this, 'POST', endpoint, body);
	return this.helpers.returnJsonArray(responseData);
}

/**
 * Update a resource in Easy!Appointments
 */
export async function updateResource(
	this: IExecuteFunctions,
	itemIndex: number,
	endpoint: string,
	fields: string[],
): Promise<INodeExecutionData[]> {
	const body: IDataObject = {};

	for (const field of fields) {
		const value = this.getNodeParameter(field, itemIndex, '') as string;
		if (value !== '') {
			body[field] = value;
		}
	}

	const responseData = await easyAppointmentsApiRequest.call(this, 'PUT', endpoint, body);
	return this.helpers.returnJsonArray(responseData);
}

/**
 * Get a resource from Easy!Appointments
 */
export async function getResource(
	this: IExecuteFunctions,
	itemIndex: number,
	endpoint: string,
): Promise<INodeExecutionData[]> {
	const responseData = await easyAppointmentsApiRequest.call(this, 'GET', endpoint);
	return this.helpers.returnJsonArray(responseData);
}

/**
 * Get all resources from Easy!Appointments
 */
export async function getAllResources(
	this: IExecuteFunctions,
	itemIndex: number,
	endpoint: string,
): Promise<INodeExecutionData[]> {
	const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
	const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
	const qs: IDataObject = {};

	// Add standard query parameters
	if (additionalFields.fields) {
		qs.fields = additionalFields.fields as string;
	}

	if (additionalFields.with) {
		qs.with = additionalFields.with as string;
	}

	if (additionalFields.sort) {
		qs.sort = additionalFields.sort as string;
	}

	if (additionalFields.q) {
		qs.q = additionalFields.q as string;
	}

	// Add resource-specific filters if they exist
	try {
		const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;

		// Merge filters into query parameters
		Object.assign(qs, filters);
	} catch (error) {
		// If filters parameter doesn't exist, just continue
	}

	let responseData;
	if (returnAll) {
		responseData = await easyAppointmentsApiRequestAllItems.call(this, 'GET', endpoint, {}, qs);
	} else {
		const limit = this.getNodeParameter('limit', itemIndex) as number;
		qs.page = 1;
		qs.length = limit;
		responseData = await easyAppointmentsApiRequest.call(this, 'GET', endpoint, {}, qs);
	}

	return this.helpers.returnJsonArray(responseData);
}

/**
 * Delete a resource from Easy!Appointments
 */
export async function deleteResource(
	this: IExecuteFunctions,
	itemIndex: number,
	endpoint: string,
): Promise<INodeExecutionData[]> {
	await easyAppointmentsApiRequest.call(this, 'DELETE', endpoint);
	return [{ json: { success: true } }];
}

/**
 * Common fields for all resources
 */
export const commonFields: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'string',
				default: '',
				description: 'Comma-separated list of fields to include in the response',
			},
			{
				displayName: 'Include Related',
				name: 'with',
				type: 'string',
				default: '',
				description: 'Comma-separated list of related data to include in the response',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '',
				description: 'Sort results by field (prefix with - for descending order)',
			},
			{
				displayName: 'Search Query',
				name: 'q',
				type: 'string',
				default: '',
				description: 'Search term to filter results',
			},
		],
	},
];
