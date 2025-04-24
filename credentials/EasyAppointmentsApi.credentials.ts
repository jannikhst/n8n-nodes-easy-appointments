import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EasyAppointmentsApi implements ICredentialType {
	name = 'easyAppointmentsApi';
	displayName = 'Easy!Appointments API';
	documentationUrl = 'https://easyappointments.org/docs.html';
	properties: INodeProperties[] = [
		{
			displayName: 'Authentication Type',
			name: 'authenticationType',
			type: 'options',
			options: [
				{
					name: 'Bearer Token',
					value: 'bearerToken',
				},
				{
					name: 'Basic Auth',
					value: 'basicAuth',
				},
			],
			default: 'bearerToken',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authenticationType: ['bearerToken'],
				},
			},
			typeOptions: {
				password: true,
			},
			description: 'The API key obtained from the Easy!Appointments settings page',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authenticationType: ['basicAuth'],
				},
			},
			description: 'Username of an admin user',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authenticationType: ['basicAuth'],
				},
			},
			typeOptions: {
				password: true,
			},
			description: 'Password of an admin user',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://demo.easyappointments.org/index.php/api/v1',
			description: 'The base URL of your Easy!Appointments installation',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				// Basic Auth is only used when authenticationType is set to basicAuth
				username: '={{ $credentials.authenticationType === "basicAuth" ? $credentials.username : undefined }}',
				password: '={{ $credentials.authenticationType === "basicAuth" ? $credentials.password : undefined }}',
			},
			headers: {
				// Bearer Token is only used when authenticationType is set to bearerToken
				Authorization: '={{ $credentials.authenticationType === "bearerToken" ? "Bearer " + $credentials.apiKey : undefined }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl }}',
			url: '/appointments',
			method: 'GET',
		},
	};
}
