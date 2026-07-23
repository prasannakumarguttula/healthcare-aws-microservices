const { v4: uuidv4 } = require('uuid');

class LocalPatientStore {
  constructor() {
    this.patients = new Map();
  }

  async create(data) {
    const now = new Date().toISOString();
    const patient = {
      id: uuidv4(),
      mrn: `MRN-${Date.now().toString(36).toUpperCase()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender || null,
      address: data.address || null,
      bloodType: data.bloodType || null,
      allergies: data.allergies || [],
      emergencyContact: data.emergencyContact || null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.patients.set(patient.id, patient);
    return patient;
  }

  async findAll({ limit = 50, status } = {}) {
    let items = Array.from(this.patients.values());
    if (status) items = items.filter((p) => p.status === status);
    return items
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async findById(id) {
    return this.patients.get(id) || null;
  }

  async update(id, patch) {
    const existing = this.patients.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      mrn: existing.mrn,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.patients.set(id, updated);
    return updated;
  }

  async softDelete(id) {
    return this.update(id, { status: 'inactive' });
  }
}

class DynamoPatientStore {
  constructor() {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } =
      require('@aws-sdk/lib-dynamodb');
    this.doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    this.table = process.env.PATIENTS_TABLE || 'healthcare-patients';
    this.PutCommand = PutCommand;
    this.GetCommand = GetCommand;
    this.ScanCommand = ScanCommand;
  }

  async create(data) {
    const now = new Date().toISOString();
    const patient = {
      id: uuidv4(),
      mrn: `MRN-${Date.now().toString(36).toUpperCase()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender || null,
      address: data.address || null,
      bloodType: data.bloodType || null,
      allergies: data.allergies || [],
      emergencyContact: data.emergencyContact || null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    await this.doc.send(new this.PutCommand({ TableName: this.table, Item: patient }));
    return patient;
  }

  async findAll({ limit = 50 } = {}) {
    const res = await this.doc.send(
      new this.ScanCommand({ TableName: this.table, Limit: limit })
    );
    return res.Items || [];
  }

  async findById(id) {
    const res = await this.doc.send(
      new this.GetCommand({ TableName: this.table, Key: { id } })
    );
    return res.Item || null;
  }

  async update(id, patch) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      mrn: existing.mrn,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await this.doc.send(new this.PutCommand({ TableName: this.table, Item: updated }));
    return updated;
  }

  async softDelete(id) {
    return this.update(id, { status: 'inactive' });
  }
}

function createStore() {
  if (process.env.USE_LOCAL_STORE === 'true' || !process.env.PATIENTS_TABLE) {
    return new LocalPatientStore();
  }
  return new DynamoPatientStore();
}

module.exports = { createStore };
