import mongoose from 'mongoose';

export interface IMatch {
    _id?: string;
    item1Id: string;
    userId1: string;
    item2Id: string;
    userId2: string;
    matchScore: number;
}

const matchSchema = new mongoose.Schema<IMatch>(
    {
        item1Id: {
            type: String,
            required: true,
        },
        userId1: {
            type: String,
            required: true,
        },
        item2Id: {
            type: String,
            required: true,
        },
        userId2: {
            type: String,
            required: true,
        },
        matchScore: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

const matchModel = mongoose.model<IMatch>('matches', matchSchema);

export default matchModel;
