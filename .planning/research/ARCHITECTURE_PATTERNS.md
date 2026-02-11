
## Patterns to Follow

### Pattern 1: Repository Pattern for Data Access

**What:** Abstract data access behind interfaces to decouple business logic from storage implementation.

**When:** All database and storage operations.

**Example:**
```typescript
// Repository interface
interface ImageRepository {
  findAll(filters?: ImageFilters): Promise<Image[]>
  findById(id: string): Promise<Image | null>
  create(data: CreateImageDto): Promise<Image>
  update(id: string, data: UpdateImageDto): Promise<Image>
  delete(id: string): Promise<void>
}

// Prisma implementation
class PrismaImageRepository implements ImageRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters?: ImageFilters): Promise<Image[]> {
    return this.prisma.image.findMany({
      where: this.buildWhereClause(filters),
      include: { tags: true }
    })
  }
  // ... other methods
}
```

**Benefits:**
- Easy to swap storage backends
- Simplified testing with mock repositories
- Business logic independent of storage details

### Pattern 2: Service Layer for Business Logic

**What:** Encapsulate business logic in service classes that orchestrate repositories and other services.

**When:** All business operations that involve multiple steps or cross-cutting concerns.

**Example:**
```typescript
class ImageService {
  constructor(
    private imageRepo: ImageRepository,
    private vectorService: VectorService,
    private ocrService: OCRService
  ) {}

  async uploadImage(file: File, tags: string[]): Promise<Image> {
    // Save file
    const filePath = await this.saveFile(file)

    // Create database record
    const image = await this.imageRepo.create({
      filePath,
      size: file.size,
      mimeType: file.type
    })

    // Async processing (fire and forget)
    this.vectorService.generateEmbedding(image.id, filePath)
    this.ocrService.extractText(image.id, filePath)

    return image
  }
}
```

**Benefits:**
- Business logic centralized and testable
- Services can be composed
- Clear separation of concerns
