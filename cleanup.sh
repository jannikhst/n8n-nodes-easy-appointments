#!/bin/bash

# Remove example nodes
rm -rf nodes/ExampleNode
rm -rf nodes/HttpBin

# Remove example credentials
rm -f credentials/ExampleCredentialsApi.credentials.ts
rm -f credentials/HttpBinApi.credentials.ts

# Remove old node files that were merged into EasyAppointments.node.ts
rm -f nodes/EasyAppointments/Appointments.node.ts
rm -f nodes/EasyAppointments/Availabilities.node.ts
rm -f nodes/EasyAppointments/Customers.node.ts
rm -f nodes/EasyAppointments/Services.node.ts

echo "Cleanup completed successfully!"
