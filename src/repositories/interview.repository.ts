import { Interview, IInterview } from "@/lib/models";
import { UpdateQuery, Types } from "mongoose";

export class InterviewRepository {
  async findById(id: string) {
    return Interview.findById(id).lean();
  }

  async findByIdPopulated(id: string) {
    return Interview.findById(id)
      .populate("candidateId", "fullName email")
      .populate("jobPostingId", "title department designation")
      .lean();
  }

  async findByToken(token: string) {
    return Interview.findOne({ token }).lean();
  }

  async findByCandidateId(candidateId: string) {
    return Interview.findOne({ candidateId: new Types.ObjectId(candidateId) }).sort({ createdAt: -1 }).lean();
  }

  async create(data: Partial<IInterview>) {
    const interview = new Interview(data);
    return interview.save();
  }

  async update(id: string, data: UpdateQuery<IInterview>) {
    return Interview.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).lean();
  }

  async updateByToken(token: string, data: UpdateQuery<IInterview>) {
    return Interview.findOneAndUpdate({ token }, data, { returnDocument: "after", runValidators: true }).lean();
  }

  async countByStatus(status: IInterview["status"]) {
    return Interview.countDocuments({ status });
  }

  async averageOverallScore() {
    const result = await Interview.aggregate([
      { $match: { status: "COMPLETED", "report.overallScore": { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: "$report.overallScore" }, count: { $sum: 1 } } },
    ]);
    return result[0] || { avgScore: 0, count: 0 };
  }
}

export const interviewRepository = new InterviewRepository();
