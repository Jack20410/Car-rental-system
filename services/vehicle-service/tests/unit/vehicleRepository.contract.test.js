/**
 * CONTRACT UNIT TEST — IVehicleRepository
 * Validates the interface contract using a lightweight in-memory mock.
 * No MongoDB required. Runs in milliseconds.
 */
const IVehicleRepository = require('../../src/interfaces/IVehicleRepository');

class MockVehicleRepository extends IVehicleRepository {
  constructor() {
    super();
    this.vehicles = [];
    this.idCounter = 1;
  }

  async create(vehicleData) {
    const vehicle = {
      _id: String(this.idCounter++),
      ...vehicleData,
      status: vehicleData.status || 'Available',
      createdAt: new Date(),
      toObject() { return { ...this }; delete this.toObject; },
    };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  async findById(id) {
    return this.vehicles.find(v => v._id === id) || null;
  }

  async findByLicensePlate(licensePlate, excludeId = null) {
    return this.vehicles.find(
      v => v.licensePlate === licensePlate && v._id !== excludeId
    ) || null;
  }

  async findWithPagination(queryParams) {
    let filtered = [...this.vehicles];
    if (queryParams.brand) {
      const re = new RegExp(queryParams.brand, 'i');
      filtered = filtered.filter(v => re.test(v.brand));
    }
    if (queryParams.status) {
      filtered = filtered.filter(v => v.status === queryParams.status);
    }
    const page = Number(queryParams.page) || 1;
    const limit = Number(queryParams.limit) || 10;
    const skip = (page - 1) * limit;
    const paged = filtered.slice(skip, skip + limit);
    return { vehicles: paged, total: filtered.length, page, pages: Math.ceil(filtered.length / limit) };
  }

  async updateById(id, updates) {
    const idx = this.vehicles.findIndex(v => v._id === id);
    if (idx === -1) return null;
    this.vehicles[idx] = { ...this.vehicles[idx], ...updates };
    return this.vehicles[idx];
  }

  async updateStatus(id, status) {
    return this.updateById(id, { status });
  }

  async deleteById(id) {
    const idx = this.vehicles.findIndex(v => v._id === id);
    if (idx === -1) return null;
    return this.vehicles.splice(idx, 1)[0];
  }

  async removeImage(id, imagePath) {
    const v = this.vehicles.find(v => v._id === id);
    if (!v) return null;
    v.images = (v.images || []).filter(img => img !== imagePath);
    return v;
  }
}

// ---- Contract Tests ----

describe('IVehicleRepository Contract', () => {
  let repo;

  beforeEach(() => { repo = new MockVehicleRepository(); });

  it('create() should persist and return a vehicle', async () => {
    const v = await repo.create({ name: 'Camry', brand: 'Toyota', licensePlate: 'ABC-123', images: [] });
    expect(v._id).toBeDefined();
    expect(v.brand).toBe('Toyota');
    expect(v.status).toBe('Available');
  });

  it('findById() should return the vehicle or null', async () => {
    const v = await repo.create({ name: 'Civic', brand: 'Honda', licensePlate: 'XYZ-789', images: [] });
    expect(await repo.findById(v._id)).not.toBeNull();
    expect(await repo.findById('ghost')).toBeNull();
  });

  it('findByLicensePlate() should find by plate and respect excludeId', async () => {
    const v = await repo.create({ name: 'A', brand: 'B', licensePlate: 'DUP-001', images: [] });
    expect(await repo.findByLicensePlate('DUP-001')).not.toBeNull();
    expect(await repo.findByLicensePlate('DUP-001', v._id)).toBeNull();
    expect(await repo.findByLicensePlate('NONE')).toBeNull();
  });

  it('findWithPagination() should filter and paginate', async () => {
    await repo.create({ name: 'Corolla', brand: 'Toyota', licensePlate: 'T-1', images: [] });
    await repo.create({ name: 'Accord', brand: 'Honda', licensePlate: 'H-1', images: [] });
    await repo.create({ name: 'RAV4', brand: 'Toyota', licensePlate: 'T-2', images: [] });

    const result = await repo.findWithPagination({ brand: 'Toyota' });
    expect(result.total).toBe(2);
    expect(result.vehicles.length).toBe(2);

    const paged = await repo.findWithPagination({ page: 1, limit: 1 });
    expect(paged.vehicles.length).toBe(1);
    expect(paged.pages).toBe(3);
  });

  it('updateById() should apply updates', async () => {
    const v = await repo.create({ name: 'Old', brand: 'B', licensePlate: 'U-1', images: [] });
    const updated = await repo.updateById(v._id, { name: 'New' });
    expect(updated.name).toBe('New');
  });

  it('updateStatus() should change only status', async () => {
    const v = await repo.create({ name: 'V', brand: 'B', licensePlate: 'S-1', images: [] });
    const updated = await repo.updateStatus(v._id, 'Rented');
    expect(updated.status).toBe('Rented');
  });

  it('deleteById() should remove the vehicle', async () => {
    const v = await repo.create({ name: 'D', brand: 'B', licensePlate: 'D-1', images: [] });
    await repo.deleteById(v._id);
    expect(await repo.findById(v._id)).toBeNull();
  });

  it('removeImage() should remove an image path', async () => {
    const v = await repo.create({ name: 'I', brand: 'B', licensePlate: 'I-1', images: ['/a.jpg', '/b.jpg'] });
    const updated = await repo.removeImage(v._id, '/a.jpg');
    expect(updated.images).toEqual(['/b.jpg']);
  });
});
