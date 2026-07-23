# API Examples

Base URL (local): `http://localhost:8080`  
Base URL (AWS): `http://<alb-dns-name>` from `terraform output api_base_url`

## Patients

```http
POST /patients
Content-Type: application/json

{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "dateOfBirth": "1815-12-10",
  "phone": "+1-555-0100",
  "gender": "female",
  "bloodType": "O+",
  "allergies": ["penicillin"],
  "emergencyContact": { "name": "Charles Babbage", "phone": "+1-555-0101" }
}
```

```http
GET /patients
GET /patients/{id}
PUT /patients/{id}
DELETE /patients/{id}
```

## Appointments

```http
POST /appointments
Content-Type: application/json

{
  "patientId": "<uuid>",
  "doctorName": "Dr. Turing",
  "specialty": "Cardiology",
  "scheduledAt": "2026-08-15T10:00:00Z",
  "durationMinutes": 30,
  "reason": "Annual checkup",
  "location": "Clinic A"
}
```

```http
GET /appointments?patientId=<uuid>
GET /appointments/{id}
PATCH /appointments/{id}
DELETE /appointments/{id}   # cancels
```

## Medical Records

```http
POST /records
Content-Type: application/json

{
  "patientId": "<uuid>",
  "type": "consultation",
  "diagnosis": "Healthy",
  "notes": "Vitals normal",
  "providerName": "Dr. Turing",
  "vitals": { "bp": "120/80", "hr": 72 },
  "prescription": null,
  "documentName": "lab-report.pdf"
}
```

Types: `consultation`, `lab`, `imaging`, `prescription`, `discharge`, `vaccination`

## Notifications

```http
POST /notifications
Content-Type: application/json

{
  "type": "appointment.reminder",
  "channel": "email",
  "recipient": "<patientId>",
  "subject": "Reminder",
  "message": "Your visit is tomorrow at 10:00"
}
```

```http
GET /notifications
```
