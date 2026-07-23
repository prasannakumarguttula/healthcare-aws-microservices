const { v4: uuidv4 } = require('uuid');

class LocalAppointmentStore {
  constructor() {
    this.items = new Map();
  }

  async create(data) {
    const now = new Date().toISOString();
    const appt = {
      id: uuidv4(),
      patientId: data.patientId,
      doctorName: data.doctorName,
      specialty: data.specialty || 'General',
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes || 30,
      reason: data.reason || null,
      status: 'scheduled',
      location: data.location || 'Main Clinic',
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(appt.id, appt);
    return appt;
  }

  async findAll({ patientId, status, limit = 50 } = {}) {
    let list = Array.from(this.items.values());
    if (patientId) list = list.filter((a) => a.patientId === patientId);
    if (status) list = list.filter((a) => a.status === status);
    return list
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, limit);
  }

  async findById(id) {
    return this.items.get(id) || null;
  }

  async update(id, patch) {
    const existing = this.items.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      patientId: existing.patientId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, updated);
    return updated;
  }
}

class DynamoAppointmentStore {
  constructor() {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } =
      require('@aws-sdk/lib-dynamodb');
    this.doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    this.table = process.env.APPOINTMENTS_TABLE || 'healthcare-appointments';
    this.PutCommand = PutCommand;
    this.GetCommand = GetCommand;
    this.ScanCommand = ScanCommand;
  }

  async create(data) {
    const now = new Date().toISOString();
    const appt = {
      id: uuidv4(),
      patientId: data.patientId,
      doctorName: data.doctorName,
      specialty: data.specialty || 'General',
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes || 30,
      reason: data.reason || null,
      status: 'scheduled',
      location: data.location || 'Main Clinic',
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    };
    await this.doc.send(new this.PutCommand({ TableName: this.table, Item: appt }));
    return appt;
  }

  async findAll({ patientId, status, limit = 50 } = {}) {
    const res = await this.doc.send(
      new this.ScanCommand({ TableName: this.table, Limit: limit })
    );
    let list = res.Items || [];
    if (patientId) list = list.filter((a) => a.patientId === patientId);
    if (status) list = list.filter((a) => a.status === status);
    return list;
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
      patientId: existing.patientId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await this.doc.send(new this.PutCommand({ TableName: this.table, Item: updated }));
    return updated;
  }
}

function createStore() {
  if (process.env.USE_LOCAL_STORE === 'true' || !process.env.APPOINTMENTS_TABLE) {
    return new LocalAppointmentStore();
  }
  return new DynamoAppointmentStore();
}

module.exports = { createStore };
