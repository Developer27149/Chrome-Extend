import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { QueryEbookDto } from './dto/find-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';

@Injectable()
export class EbookService {
  constructor(private prisma: PrismaService) {}

  async create(createEbookDto: CreateEbookDto) {
    console.log('create ebook dto:', createEbookDto);
    const prisma = this.prisma;
    // 从请求体中获取数据
    const { tags = [], downloadLinks, ...ebookData } = createEbookDto;

    // 创建 ebook
    const ebook = await prisma.eBook.create({ data: ebookData });

    downloadLinks.map((downloadLink) => {
      prisma.downloadLink
        .create({
          data: {
            ...downloadLink,
            eBookId: ebook.id,
          },
        })
        .catch((e) => {
          console.error('create download link error:', e);
        });
    });
    // 处理 tags
    tags.forEach(async (name) => {
      try {
        const tag = await prisma.tag.upsert({
          where: { name },
          update: { name },
          create: { name },
        });

        console.log('tag:', tag);
        console.log('ebook id:', ebook.id);

        // 创建 eBookTag
        const resp = await prisma.eBookTag.create({
          data: {
            ebookId: ebook.id,
            tagId: tag.id,
          },
        });
        console.log('new ebook tab:', resp);
      } catch (error) {
        console.log('create tag error:', error);
      }
    });
  }

  async findAll(pagination: QueryEbookDto) {
    const {
      query = '',
      limit,
      page,
      orderBy = 'title',
      orderType = 'asc',
    } = pagination;
    const result = await this.prisma.eBook.findMany({
      skip: (page - 1) * limit,
      where: {
        OR: [
          {
            title: {
              contains: query,
            },
          },
          {
            author: {
              contains: query,
            },
          },
          {
            description: {
              contains: query,
            },
          },
        ],
      },
      orderBy: {
        [orderBy]: orderType,
      },
      include: {
        tags: {
          include: {
            Tag: true,
          },
        },
        downloadLinks: true,
      },
    });
    return {
      total: result.length,
      items: result.slice(0, limit),
    };
  }

  findOne(id: number) {
    return this.prisma.eBook.findUnique({
      where: {
        id,
      },
      include: {
        tags: true,
        downloadLinks: true,
      },
    });
  }

  update(id: number, updateEbookDto: UpdateEbookDto) {
    return `This action updates a #${id} ebook`;
  }

  remove(id: number) {
    return `This action removes a #${id} ebook`;
  }
}
