import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';

export enum InventoryItemType {
  CONSUMABLE = 'CONSUMABLE',
  FIXED_ASSET = 'FIXED_ASSET',
  EQUIPMENT = 'EQUIPMENT',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  MAINTENANCE = 'MAINTENANCE',
  OTHER = 'OTHER',
}

export enum InventoryUnit {
  PCS = 'PCS',
  BOX = 'BOX',
  UNIT = 'UNIT',
  KG = 'KG',
  LITER = 'LITER',
  METER = 'METER',
  PACK = 'PACK',
  SET = 'SET',
}

export class CreateInventoryDto {
  @ApiProperty({
    description: 'Item code',
    example: 'INV001',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Item code is required' })
  @IsString()
  @MaxLength(50)
  itemCode: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Office Chair',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Item name is required' })
  @IsString()
  @MaxLength(200)
  itemName: string;

  @ApiProperty({
    description: 'Item description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Item type',
    enum: InventoryItemType,
    example: InventoryItemType.OFFICE_SUPPLIES,
  })
  @IsNotEmpty({ message: 'Item type is required' })
  @IsEnum(InventoryItemType, { message: 'Invalid item type' })
  itemType: InventoryItemType;

  @ApiProperty({
    description: 'Unit of measure',
    enum: InventoryUnit,
    example: InventoryUnit.UNIT,
  })
  @IsNotEmpty({ message: 'Unit of measure is required' })
  @IsEnum(InventoryUnit, { message: 'Invalid unit of measure' })
  unit: InventoryUnit;

  @ApiProperty({
    description: 'Current stock quantity',
    example: 100,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Current stock is required' })
  @IsNumber()
  @Min(0)
  currentStock: number;

  @ApiProperty({
    description: 'Minimum stock level for reorder',
    example: 20,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiProperty({
    description: 'Maximum stock level',
    example: 500,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStockLevel?: number;

  @ApiProperty({
    description: 'Reorder quantity',
    example: 100,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderQuantity?: number;

  @ApiProperty({
    description: 'Unit cost',
    example: 150000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiProperty({
    description: 'Location/warehouse',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiProperty({
    description: 'Supplier name',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplier?: string;

  @ApiProperty({
    description: 'Supplier contact',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierContact?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
