import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import {
	createResource,
	deleteResource,
	getAllResources,
	getResource,
	updateResource,
	easyAppointmentsApiRequest,
	commonFields,
} from './GenericFunctions';

export class EasyAppointments implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Easy!Appointments',
		name: 'easyAppointments',
		icon: 'file:icon.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Easy!Appointments API',
		defaults: {
			name: 'Easy!Appointments',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'easyAppointmentsApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Appointment',
						value: 'appointment',
					},
					{
						name: 'Availability',
						value: 'availability',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'Provider',
						value: 'provider',
					},
					{
						name: 'Service',
						value: 'service',
					},
				],
				default: 'appointment',
				required: true,
			},

			// OPERATIONS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['appointment', 'customer', 'provider', 'service'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a record',
						action: 'Create a record',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a record',
						action: 'Delete a record',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a record',
						action: 'Get a record',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many records',
						action: 'Get many records',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a record',
						action: 'Update a record',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['availability'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get availabilities',
						action: 'Get availabilities',
					},
				],
				default: 'get',
			},

			// Common fields for getAll operations
			...commonFields,

			// APPOINTMENT FIELDS
			{
				displayName: 'Appointment ID',
				name: 'appointmentId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['appointment'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the appointment',
			},
			{
				displayName: 'Start Date Time',
				name: 'start',
				type: 'dateTime',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['appointment'],
						operation: ['create', 'update'],
					},
				},
				description: 'The start date and time of the appointment',
			},
			{
				displayName: 'End Date Time',
				name: 'end',
				type: 'dateTime',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['appointment'],
						operation: ['create', 'update'],
					},
				},
				description: 'The end date and time of the appointment',
			},
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						resource: ['appointment'],
						operation: ['create', 'update'],
					},
				},
				description: 'The ID of the customer for this appointment',
			},
			{
				displayName: 'Provider ID',
				name: 'providerId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						resource: ['appointment'],
						operation: ['create', 'update'],
					},
				},
				description: 'The ID of the provider for this appointment',
			},
			{
				displayName: 'Service ID',
				name: 'serviceId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						resource: ['appointment'],
						operation: ['create', 'update'],
					},
				},
				description: 'The ID of the service for this appointment',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['appointment'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Location',
						name: 'location',
						type: 'string',
						default: '',
						description: 'The location of the appointment',
					},
					{
						displayName: 'Color',
						name: 'color',
						type: 'color',
						default: '#000000',
						description: 'The color of the appointment in the calendar',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Booked',
								value: 'Booked',
							},
							{
								name: 'Cancelled',
								value: 'Cancelled',
							},
							{
								name: 'Confirmed',
								value: 'Confirmed',
							},
						],
						default: 'Booked',
						description: 'The status of the appointment',
					},
					{
						displayName: 'Notes',
						name: 'notes',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Notes about the appointment',
					},
				],
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['appointment'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Date',
						name: 'date',
						type: 'dateTime',
						default: '',
						description: 'Filter appointments by specific date',
					},
					{
						displayName: 'From Date',
						name: 'from',
						type: 'dateTime',
						default: '',
						description: 'Filter appointments from this date',
					},
					{
						displayName: 'Till Date',
						name: 'till',
						type: 'dateTime',
						default: '',
						description: 'Filter appointments until this date',
					},
					{
						displayName: 'Service ID',
						name: 'serviceId',
						type: 'number',
						default: 0,
						description: 'Filter appointments by service ID',
					},
					{
						displayName: 'Provider ID',
						name: 'providerId',
						type: 'number',
						default: 0,
						description: 'Filter appointments by provider ID',
					},
					{
						displayName: 'Customer ID',
						name: 'customerId',
						type: 'number',
						default: 0,
						description: 'Filter appointments by customer ID',
					},
				],
			},

			// CUSTOMER FIELDS
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the customer',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['create', 'update'],
					},
				},
				description: 'The first name of the customer',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['create', 'update'],
					},
				},
				description: 'The last name of the customer',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['create', 'update'],
					},
				},
				description: 'The email address of the customer',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['create', 'update'],
					},
				},
				description: 'The phone number of the customer (may be required depending on your Easy!Appointments settings)',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['customer'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Address',
						name: 'address',
						type: 'string',
						default: '',
						description: 'The address of the customer',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
						description: 'The city of the customer',
					},
					{
						displayName: 'ZIP',
						name: 'zip',
						type: 'string',
						default: '',
						description: 'The ZIP code of the customer',
					},
					{
						displayName: 'Timezone',
						name: 'timezone',
						type: 'string',
						default: 'UTC',
						description: 'The timezone of the customer',
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'string',
						default: 'english',
						description: 'The language of the customer',
					},
					{
						displayName: 'Notes',
						name: 'notes',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Notes about the customer',
					},
					{
						displayName: 'Custom Field 1',
						name: 'customField1',
						type: 'string',
						default: '',
						description: 'Custom field 1 value',
					},
					{
						displayName: 'Custom Field 2',
						name: 'customField2',
						type: 'string',
						default: '',
						description: 'Custom field 2 value',
					},
					{
						displayName: 'Custom Field 3',
						name: 'customField3',
						type: 'string',
						default: '',
						description: 'Custom field 3 value',
					},
					{
						displayName: 'Custom Field 4',
						name: 'customField4',
						type: 'string',
						default: '',
						description: 'Custom field 4 value',
					},
					{
						displayName: 'Custom Field 5',
						name: 'customField5',
						type: 'string',
						default: '',
						description: 'Custom field 5 value',
					},
				],
			},

			// SERVICE FIELDS
			{
				displayName: 'Service ID',
				name: 'serviceId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the service',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['create', 'update'],
					},
				},
				description: 'The name of the service',
			},
			{
				displayName: 'Duration (Minutes)',
				name: 'duration',
				type: 'number',
				required: true,
				default: 60,
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['create', 'update'],
					},
				},
				description: 'The duration of the service in minutes',
			},
			{
				displayName: 'Price',
				name: 'price',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['create', 'update'],
					},
				},
				description: 'The price of the service',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['service'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Currency',
						name: 'currency',
						type: 'string',
						default: 'USD',
						description: 'The currency of the service price',
					},
					{
						displayName: 'Location',
						name: 'location',
						type: 'string',
						default: '',
						description: 'The location where the service is provided',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Description of the service',
					},
					{
						displayName: 'Availabilities Type',
						name: 'availabilitiesType',
						type: 'options',
						options: [
							{
								name: 'Flexible',
								value: 'flexible',
							},
							{
								name: 'Fixed',
								value: 'fixed',
							},
						],
						default: 'flexible',
						description: 'The type of availability for the service',
					},
					{
						displayName: 'Attendants Number',
						name: 'attendantsNumber',
						type: 'number',
						default: 1,
						description: 'The number of attendants for the service',
					},
					{
						displayName: 'Is Private',
						name: 'isPrivate',
						type: 'boolean',
						default: false,
						description: 'Whether the service is private',
					},
					{
						displayName: 'Service Category ID',
						name: 'serviceCategoryId',
						type: 'number',
						default: 0,
						description: 'The ID of the category this service belongs to',
					},
				],
			},

			// PROVIDER FIELDS
			{
				displayName: 'Provider ID',
				name: 'providerId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['provider'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'The ID of the provider',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['provider'],
						operation: ['create', 'update'],
					},
				},
				description: 'The first name of the provider',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['provider'],
						operation: ['create', 'update'],
					},
				},
				description: 'The last name of the provider',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				displayOptions: {
					show: {
						resource: ['provider'],
						operation: ['create', 'update'],
					},
				},
				description: 'The email address of the provider',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['provider'],
						operation: ['create', 'update'],
					},
				},
				description: 'The phone number of the provider',
			},
			{
				displayName: 'Services',
				name: 'services',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['provider'],
						operation: ['create', 'update'],
					},
				},
				description: 'Comma-separated list of service IDs that the provider can provide',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['provider'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Address',
						name: 'address',
						type: 'string',
						default: '',
						description: 'The address of the provider',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
						description: 'The city of the provider',
					},
					{
						displayName: 'ZIP',
						name: 'zip',
						type: 'string',
						default: '',
						description: 'The ZIP code of the provider',
					},
					{
						displayName: 'Notes',
						name: 'notes',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Notes about the provider',
					},
					{
						displayName: 'Timezone',
						name: 'timezone',
						type: 'string',
						default: 'UTC',
						description: 'The timezone of the provider',
					},
					{
						displayName: 'Language',
						name: 'language',
						type: 'string',
						default: 'english',
						description: 'The language of the provider',
					},
					{
						displayName: 'Is Private',
						name: 'isPrivate',
						type: 'boolean',
						default: false,
						description: 'Whether the provider is private',
					},
					{
						displayName: 'Settings',
						name: 'settings',
						type: 'json',
						default: '{}',
						description: 'Provider settings as JSON object (username, password, notifications, etc.)',
					},
				],
			},

			// AVAILABILITY FIELDS
			{
				displayName: 'Provider ID',
				name: 'providerId',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						resource: ['availability'],
						operation: ['get'],
					},
				},
				description: 'The ID of the provider to get availabilities for',
			},
			{
				displayName: 'Service ID',
				name: 'serviceId',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						resource: ['availability'],
						operation: ['get'],
					},
				},
				description: 'The ID of the service to get availabilities for',
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: ['availability'],
						operation: ['get'],
					},
				},
				description: 'The date to get availabilities for',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		let responseData;

		for (let i = 0; i < items.length; i++) {
			try {
				// APPOINTMENT OPERATIONS
				if (resource === 'appointment') {
					if (operation === 'create') {
						// Create an appointment
						const fields = [
							'start',
							'end',
							'customerId',
							'providerId',
							'serviceId',
						];

						// Add additional fields if provided
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
							location?: string;
							color?: string;
							status?: string;
							notes?: string;
						};

						if (additionalFields.location) fields.push('location');
						if (additionalFields.color) fields.push('color');
						if (additionalFields.status) fields.push('status');
						if (additionalFields.notes) fields.push('notes');

						responseData = await createResource.call(this, i, '/appointments', fields);
					} else if (operation === 'delete') {
						// Delete an appointment
						const appointmentId = this.getNodeParameter('appointmentId', i) as string;
						responseData = await deleteResource.call(this, i, `/appointments/${appointmentId}`);
					} else if (operation === 'get') {
						// Get a single appointment
						const appointmentId = this.getNodeParameter('appointmentId', i) as string;
						responseData = await getResource.call(this, i, `/appointments/${appointmentId}`);
					} else if (operation === 'getAll') {
						// Get all appointments
						responseData = await getAllResources.call(this, i, '/appointments');
					} else if (operation === 'update') {
						// Update an appointment
						const appointmentId = this.getNodeParameter('appointmentId', i) as string;
						const fields = [
							'start',
							'end',
							'customerId',
							'providerId',
							'serviceId',
						];

						// Add additional fields if provided
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
							location?: string;
							color?: string;
							status?: string;
							notes?: string;
						};

						if (additionalFields.location) fields.push('location');
						if (additionalFields.color) fields.push('color');
						if (additionalFields.status) fields.push('status');
						if (additionalFields.notes) fields.push('notes');

						responseData = await updateResource.call(this, i, `/appointments/${appointmentId}`, fields);
					}
				}
				
				// CUSTOMER OPERATIONS
				else if (resource === 'customer') {
					if (operation === 'create') {
						// Create a customer
						const fields = [
							'firstName',
							'lastName',
							'email',
							'phone',
						];

						// Add additional fields if provided
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
							address?: string;
							city?: string;
							zip?: string;
							timezone?: string;
							language?: string;
							notes?: string;
							customField1?: string;
							customField2?: string;
							customField3?: string;
							customField4?: string;
							customField5?: string;
						};

						if (additionalFields.address) fields.push('address');
						if (additionalFields.city) fields.push('city');
						if (additionalFields.zip) fields.push('zip');
						if (additionalFields.timezone) fields.push('timezone');
						if (additionalFields.language) fields.push('language');
						if (additionalFields.notes) fields.push('notes');
						if (additionalFields.customField1) fields.push('customField1');
						if (additionalFields.customField2) fields.push('customField2');
						if (additionalFields.customField3) fields.push('customField3');
						if (additionalFields.customField4) fields.push('customField4');
						if (additionalFields.customField5) fields.push('customField5');

						responseData = await createResource.call(this, i, '/customers', fields);
					} else if (operation === 'delete') {
						// Delete a customer
						const customerId = this.getNodeParameter('customerId', i) as string;
						responseData = await deleteResource.call(this, i, `/customers/${customerId}`);
					} else if (operation === 'get') {
						// Get a single customer
						const customerId = this.getNodeParameter('customerId', i) as string;
						responseData = await getResource.call(this, i, `/customers/${customerId}`);
					} else if (operation === 'getAll') {
						// Get all customers
						responseData = await getAllResources.call(this, i, '/customers');
					} else if (operation === 'update') {
						// Update a customer
						const customerId = this.getNodeParameter('customerId', i) as string;
						const fields = [
							'firstName',
							'lastName',
							'email',
							'phone',
						];

						// Add additional fields if provided
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
							address?: string;
							city?: string;
							zip?: string;
							timezone?: string;
							language?: string;
							notes?: string;
							customField1?: string;
							customField2?: string;
							customField3?: string;
							customField4?: string;
							customField5?: string;
						};

						if (additionalFields.address) fields.push('address');
						if (additionalFields.city) fields.push('city');
						if (additionalFields.zip) fields.push('zip');
						if (additionalFields.timezone) fields.push('timezone');
						if (additionalFields.language) fields.push('language');
						if (additionalFields.notes) fields.push('notes');
						if (additionalFields.customField1) fields.push('customField1');
						if (additionalFields.customField2) fields.push('customField2');
						if (additionalFields.customField3) fields.push('customField3');
						if (additionalFields.customField4) fields.push('customField4');
						if (additionalFields.customField5) fields.push('customField5');

						responseData = await updateResource.call(this, i, `/customers/${customerId}`, fields);
					}
				}
				
				// SERVICE OPERATIONS
				else if (resource === 'service') {
					if (operation === 'create') {
						// Create a service
						const fields = [
							'name',
							'duration',
							'price',
						];

						// Add additional fields if provided
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
							currency?: string;
							location?: string;
							description?: string;
							availabilitiesType?: string;
							attendantsNumber?: number;
							isPrivate?: boolean;
							serviceCategoryId?: number;
						};

						if (additionalFields.currency) fields.push('currency');
						if (additionalFields.location) fields.push('location');
						if (additionalFields.description) fields.push('description');
						if (additionalFields.availabilitiesType) fields.push('availabilitiesType');
						if (additionalFields.attendantsNumber) fields.push('attendantsNumber');
						if (additionalFields.isPrivate !== undefined) fields.push('isPrivate');
						if (additionalFields.serviceCategoryId) fields.push('serviceCategoryId');

						responseData = await createResource.call(this, i, '/services', fields);
					} else if (operation === 'delete') {
						// Delete a service
						const serviceId = this.getNodeParameter('serviceId', i) as string;
						responseData = await deleteResource.call(this, i, `/services/${serviceId}`);
					} else if (operation === 'get') {
						// Get a single service
						const serviceId = this.getNodeParameter('serviceId', i) as string;
						responseData = await getResource.call(this, i, `/services/${serviceId}`);
					} else if (operation === 'getAll') {
						// Get all services
						responseData = await getAllResources.call(this, i, '/services');
					} else if (operation === 'update') {
						// Update a service
						const serviceId = this.getNodeParameter('serviceId', i) as string;
						const fields = [
							'name',
							'duration',
							'price',
						];

						// Add additional fields if provided
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
							currency?: string;
							location?: string;
							description?: string;
							availabilitiesType?: string;
							attendantsNumber?: number;
							isPrivate?: boolean;
							serviceCategoryId?: number;
						};

						if (additionalFields.currency) fields.push('currency');
						if (additionalFields.location) fields.push('location');
						if (additionalFields.description) fields.push('description');
						if (additionalFields.availabilitiesType) fields.push('availabilitiesType');
						if (additionalFields.attendantsNumber) fields.push('attendantsNumber');
						if (additionalFields.isPrivate !== undefined) fields.push('isPrivate');
						if (additionalFields.serviceCategoryId) fields.push('serviceCategoryId');

						responseData = await updateResource.call(this, i, `/services/${serviceId}`, fields);
					}
				}
				
				// PROVIDER OPERATIONS
				else if (resource === 'provider') {
					if (operation === 'create') {
						// Create a provider
						const fields = [
							'firstName',
							'lastName',
							'email',
							'phone',
						];

						// Create a body object for the request
						const body: IDataObject = {};
						
						// Add basic fields
						body.firstName = this.getNodeParameter('firstName', i, '') as string;
						body.lastName = this.getNodeParameter('lastName', i, '') as string;
						body.email = this.getNodeParameter('email', i, '') as string;
						body.phone = this.getNodeParameter('phone', i, '') as string;
						
						// Handle services field (convert comma-separated string to array)
						const services = this.getNodeParameter('services', i, '') as string;
						if (services) {
							body.services = services.split(',').map(id => parseInt(id.trim(), 10));
						}

						// Add additional fields if provided
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
							address?: string;
							city?: string;
							zip?: string;
							notes?: string;
							timezone?: string;
							language?: string;
							isPrivate?: boolean;
							settings?: string;
						};

						if (additionalFields.address) body.address = additionalFields.address;
						if (additionalFields.city) body.city = additionalFields.city;
						if (additionalFields.zip) body.zip = additionalFields.zip;
						if (additionalFields.notes) body.notes = additionalFields.notes;
						if (additionalFields.timezone) body.timezone = additionalFields.timezone;
						if (additionalFields.language) body.language = additionalFields.language;
						if (additionalFields.isPrivate !== undefined) body.isPrivate = additionalFields.isPrivate;
						
						// Handle settings as JSON
						if (additionalFields.settings) {
							try {
								body.settings = JSON.parse(additionalFields.settings);
							} catch (error) {
								throw new Error(`Invalid settings JSON: ${error.message}`);
							}
						}

						responseData = await easyAppointmentsApiRequest.call(this, 'POST', '/providers', body);
					} else if (operation === 'delete') {
						// Delete a provider
						const providerId = this.getNodeParameter('providerId', i) as string;
						responseData = await deleteResource.call(this, i, `/providers/${providerId}`);
					} else if (operation === 'get') {
						// Get a single provider
						const providerId = this.getNodeParameter('providerId', i) as string;
						responseData = await getResource.call(this, i, `/providers/${providerId}`);
					} else if (operation === 'getAll') {
						// Get all providers
						responseData = await getAllResources.call(this, i, '/providers');
					} else if (operation === 'update') {
						// Update a provider
						const providerId = this.getNodeParameter('providerId', i) as string;
						
						// Create a body object for the request
						const body: IDataObject = {};
						
						// Add basic fields
						body.firstName = this.getNodeParameter('firstName', i, '') as string;
						body.lastName = this.getNodeParameter('lastName', i, '') as string;
						body.email = this.getNodeParameter('email', i, '') as string;
						body.phone = this.getNodeParameter('phone', i, '') as string;
						
						// Handle services field (convert comma-separated string to array)
						const services = this.getNodeParameter('services', i, '') as string;
						if (services) {
							body.services = services.split(',').map(id => parseInt(id.trim(), 10));
						}

						// Add additional fields if provided
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
							address?: string;
							city?: string;
							zip?: string;
							notes?: string;
							timezone?: string;
							language?: string;
							isPrivate?: boolean;
							settings?: string;
						};

						if (additionalFields.address) body.address = additionalFields.address;
						if (additionalFields.city) body.city = additionalFields.city;
						if (additionalFields.zip) body.zip = additionalFields.zip;
						if (additionalFields.notes) body.notes = additionalFields.notes;
						if (additionalFields.timezone) body.timezone = additionalFields.timezone;
						if (additionalFields.language) body.language = additionalFields.language;
						if (additionalFields.isPrivate !== undefined) body.isPrivate = additionalFields.isPrivate;
						
						// Handle settings as JSON
						if (additionalFields.settings) {
							try {
								body.settings = JSON.parse(additionalFields.settings);
							} catch (error) {
								throw new Error(`Invalid settings JSON: ${error.message}`);
							}
						}

						responseData = await easyAppointmentsApiRequest.call(this, 'PUT', `/providers/${providerId}`, body);
					}
				}
				
				// AVAILABILITY OPERATIONS
				else if (resource === 'availability') {
					if (operation === 'get') {
						// Get availabilities
						const qs: IDataObject = {};
						
						const providerId = this.getNodeParameter('providerId', i, 0) as number;
						if (providerId) {
							qs.providerId = providerId;
						}
						
						const serviceId = this.getNodeParameter('serviceId', i, 0) as number;
						if (serviceId) {
							qs.serviceId = serviceId;
						}
						
						const date = this.getNodeParameter('date', i, '') as string;
						if (date) {
							qs.date = date;
						}
						
						responseData = await easyAppointmentsApiRequest.call(this, 'GET', '/availabilities', {}, qs);
					}
				}

				if (responseData !== undefined) {
					Array.isArray(responseData)
						? returnData.push(...this.helpers.returnJsonArray(responseData))
						: returnData.push({ json: responseData as IDataObject });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
