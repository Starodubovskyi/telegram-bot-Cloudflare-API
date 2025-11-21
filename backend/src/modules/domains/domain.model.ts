import { Schema, model, type Document, type Model } from "mongoose";

export interface DomainAttrs {
    name: string;
    zoneId: string;
    ns: string[];
    ownerTelegramId?: number;
}

export interface DomainDocument extends DomainAttrs, Document {
    createdAt: Date;
    updatedAt: Date;
}

export type DomainModel = Model<DomainDocument>;

const domainSchema = new Schema<DomainDocument>(
    {
        name: { type: String, required: true },
        zoneId: { type: String, required: true },
        ns: [{ type: String, required: true }],
        ownerTelegramId: { type: Number }
    },
    { timestamps: true }
);

domainSchema.index({ name: 1 }, { unique: true });

export const Domain: DomainModel = model<DomainDocument>("Domain", domainSchema);
