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
				{ name: 'Bearer Token', value: 'bearerToken' },
				{ name: 'Basic Auth', value: 'basicAuth' },
			],
			default: 'bearerToken',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			displayOptions: {
				show: { authenticationType: ['bearerToken'] },
			},
			typeOptions: { password: true },
			description: 'The API key from Easy!Appointments settings',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			displayOptions: {
				show: { authenticationType: ['basicAuth'] },
			},
			description: 'Admin username',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			default: '',
			displayOptions: {
				show: { authenticationType: ['basicAuth'] },
			},
			typeOptions: { password: true },
			description: 'Admin password',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://demo.easyappointments.org/index.php/api/v1',
			description: 'Your Easy!Appointments base URL',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization:
					`={{ 
						$credentials.authenticationType === "bearerToken" 
							? "Bearer " + $credentials.apiKey 
							: ($credentials.authenticationType === "basicAuth" 
								? "Basic " + Buffer.from($credentials.username + ":" + $credentials.password).toString("base64") 
								: undefined
							) 
					}}`,
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