import { Schema, model, type Document, type Model } from "mongoose";


export interface UserAttrs {
    telegramId?: number;
    username?: string;
}

export interface UserDocument extends UserAttrs, Document {
    createdAt: Date;
    updatedAt: Date;
}

export type UserModel = Model<UserDocument>;

const userSchema = new Schema<UserDocument>(
    {
        telegramId: { type: Number },
        username: { type: String }
    },
    { timestamps: true }
);

// username и telegramId могут быть пустыми, поэтому sparse.
userSchema.index({ telegramId: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });

export const User: UserModel = model<UserDocument>("User", userSchema);
