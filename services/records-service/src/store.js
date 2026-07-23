const { v4: uuidv4 } = require('uuid');

class LocalRecordsStore {
  constructor() { this.items = new Map(); }
  async create(data) {
    const now = new Date().toISOString();
    const record = {
      id: uuidv4(), patientId: data.patientId, type: data.type || 'consultation',
      diagnosis: data.diagnosis || null, notes: data.notes || null,
      prescription: data.prescription || null, vitals: data.vitals || null,
      providerName: data.providerName || null, documentKey: data.documentKey || null,
      status: 'active', createdAt: now, updatedAt: now,
    };
    this.items.set(record.id, record);
    return record;
  }
  async findAll({ patientId, type, limit = 50 } = {}) {
    let list = Array.from(this.items.values());
    if (patientId) list = list.filter((r) => r.patientId === patientId);
    if (type) list = list.filter((r) => r.type === type);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
  async findById(id) { return this.items.get(id) || null; }
  async update(id, patch) {
    const existing = this.items.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, id: existing.id, patientId: existing.patientId, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    this.items.set(id, updated);
    return updated;
  }
}

class DynamoRecordsStore {
  constructor() {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
    this.doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    this.table = process.env.RECORDS_TABLE || 'healthcare-records';
    this.PutCommand = PutCommand; this.GetCommand = GetCommand; this.ScanCommand = ScanCommand;
  }
  async create(data) {
    const now = new Date().toISOString();
    const record = {
      id: uuidv4(), patientId: data.patientId, type: data.type || 'consultation',
      diagnosis: data.diagnosis || null, notes: data.notes || null,
      prescription: data.prescription || null, vitals: data.vitals || null,
      providerName: data.providerName || null, documentKey: data.documentKey || null,
      status: 'active', createdAt: now, updatedAt: now,
    };
    await this.doc.send(new this.PutCommand({ TableName: this.table, Item: record }));
    return record;
  }
  async findAll({ patientId, type, limit = 50 } = {}) {
    const res = await this.doc.send(new this.ScanCommand({ TableName: this.table, Limit: limit }));
    let list = res.Items || [];
    if (patientId) list = list.filter((r) => r.patientId === patientId);
    if (type) list = list.filter((r) => r.type === type);
    return list;
  }
  async findById(id) {
    const res = await this.doc.send(new this.GetCommand({ TableName: this.table, Key: { id } }));
    return res.Item || null;
  }
  async update(id, patch) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, id: existing.id, patientId: existing.patientId, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    await this.doc.send(new this.PutCommand({ TableName: this.table, Item: updated }));
    return updated;
  }
}

function createStore() {
  if (process.env.USE_LOCAL_STORE === 'true' || !process.env.RECORDS_TABLE) return new LocalRecordsStore();
  return new DynamoRecordsStore();
}
module.exports = { createStore };
