import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { Prisma } from '@prisma/client';

export const getHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const pullSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sinceQuery = req.query.since as string;
    const since = sinceQuery ? new Date(sinceQuery) : new Date(0);

    if (isNaN(since.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid since date format' });
    }

    // Get current server time
    const currentServerTime = new Date();

    // Pull all items updated after 'since'
    const products = await prisma.product.findMany({
      where: {
        updatedAt: { gt: since },
      },
    });

    const customers = await prisma.customer.findMany({
      where: {
        updatedAt: { gt: since },
      },
    });

    const sales = await prisma.sale.findMany({
      where: {
        updatedAt: { gt: since },
      },
    });

    const saleItems = await prisma.saleItem.findMany({
      where: {
        updatedAt: { gt: since },
      },
    });

    res.status(200).json({
      success: true,
      timestamp: currentServerTime.toISOString(),
      changes: {
        products,
        customers,
        sales,
        saleItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const pushSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { changes, clientId, clientName } = req.body;

    if (!changes) {
      return res.status(400).json({ success: false, error: 'Missing changes in request body' });
    }

    const {
      products = [],
      customers = [],
      sales = [],
      saleItems = [],
    } = changes;

    // Optional: track client sync metadata
    if (clientId) {
      await prisma.syncMetadata.upsert({
        where: { clientId },
        create: {
          clientId,
          clientName,
          lastSyncedAt: new Date(),
          ipAddress: req.ip,
        },
        update: {
          clientName,
          lastSyncedAt: new Date(),
          ipAddress: req.ip,
        },
      });
    }

    // Process in dependency order: products & customers -> sales -> saleItems
    
    // 1. Process Products
    for (const p of products) {
      const existing = await prisma.product.findUnique({ where: { id: p.id } });
      if (existing && existing.deletedAt && !p.deletedAt) {
        // Soft delete precedence: ignore active update if server already has it deleted
        continue;
      }
      await prisma.product.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          price: new Prisma.Decimal(p.price),
          stockQty: parseInt(p.stockQty, 10),
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          clientUpdatedAt: p.clientUpdatedAt ? new Date(p.clientUpdatedAt) : (p.updatedAt ? new Date(p.updatedAt) : null),
          deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
          version: p.version ? parseInt(p.version, 10) : 1,
        },
        update: {
          name: p.name,
          sku: p.sku,
          category: p.category,
          price: new Prisma.Decimal(p.price),
          stockQty: parseInt(p.stockQty, 10),
          clientUpdatedAt: p.clientUpdatedAt ? new Date(p.clientUpdatedAt) : (p.updatedAt ? new Date(p.updatedAt) : null),
          deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
          version: p.version ? parseInt(p.version, 10) : { increment: 1 },
        },
      });
    }

    // 2. Process Customers
    for (const c of customers) {
      const existing = await prisma.customer.findUnique({ where: { id: c.id } });
      if (existing && existing.deletedAt && !c.deletedAt) {
        continue;
      }
      await prisma.customer.upsert({
        where: { id: c.id },
        create: {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
          clientUpdatedAt: c.clientUpdatedAt ? new Date(c.clientUpdatedAt) : (c.updatedAt ? new Date(c.updatedAt) : null),
          deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
          version: c.version ? parseInt(c.version, 10) : 1,
        },
        update: {
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          clientUpdatedAt: c.clientUpdatedAt ? new Date(c.clientUpdatedAt) : (c.updatedAt ? new Date(c.updatedAt) : null),
          deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
          version: c.version ? parseInt(c.version, 10) : { increment: 1 },
        },
      });
    }

    // 3. Process Sales
    for (const s of sales) {
      const existing = await prisma.sale.findUnique({ where: { id: s.id } });
      if (existing && existing.deletedAt && !s.deletedAt) {
        continue;
      }
      await prisma.sale.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          customerId: s.customerId || null,
          totalAmount: new Prisma.Decimal(s.totalAmount),
          saleDate: s.saleDate ? new Date(s.saleDate) : undefined,
          createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
          clientUpdatedAt: s.clientUpdatedAt ? new Date(s.clientUpdatedAt) : (s.updatedAt ? new Date(s.updatedAt) : null),
          deletedAt: s.deletedAt ? new Date(s.deletedAt) : null,
          version: s.version ? parseInt(s.version, 10) : 1,
        },
        update: {
          customerId: s.customerId || null,
          totalAmount: new Prisma.Decimal(s.totalAmount),
          saleDate: s.saleDate ? new Date(s.saleDate) : undefined,
          clientUpdatedAt: s.clientUpdatedAt ? new Date(s.clientUpdatedAt) : (s.updatedAt ? new Date(s.updatedAt) : null),
          deletedAt: s.deletedAt ? new Date(s.deletedAt) : null,
          version: s.version ? parseInt(s.version, 10) : { increment: 1 },
        },
      });
    }

    // 4. Process Sale Items
    for (const item of saleItems) {
      const existing = await prisma.saleItem.findUnique({ where: { id: item.id } });
      if (existing && existing.deletedAt && !item.deletedAt) {
        continue;
      }
      await prisma.saleItem.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          saleId: item.saleId,
          productId: item.productId,
          qty: parseInt(item.qty, 10),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(item.totalPrice),
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
          clientUpdatedAt: item.clientUpdatedAt ? new Date(item.clientUpdatedAt) : (item.updatedAt ? new Date(item.updatedAt) : null),
          deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
        },
        update: {
          saleId: item.saleId,
          productId: item.productId,
          qty: parseInt(item.qty, 10),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(item.totalPrice),
          clientUpdatedAt: item.clientUpdatedAt ? new Date(item.clientUpdatedAt) : (item.updatedAt ? new Date(item.updatedAt) : null),
          deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
        },
      });
    }

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
