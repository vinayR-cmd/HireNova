import { Candidate, ICandidate, CandidateStatus } from "@/lib/models";
import { QueryFilter, UpdateQuery, Types } from "mongoose";

export class CandidateRepository {
  async findById(id: string) {
    return Candidate.findById(id).lean();
  }

  async findByIdPopulated(id: string) {
    return Candidate.findById(id).populate("jobPostingId", "title department designation requiredSkills description").lean();
  }

  async create(data: Partial<ICandidate>) {
    const candidate = new Candidate(data);
    return candidate.save();
  }

  async update(id: string, data: UpdateQuery<ICandidate>) {
    return Candidate.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).lean();
  }

  async findByJobPosting(jobPostingId: string, options?: { status?: CandidateStatus }) {
    const filter: QueryFilter<ICandidate> = { jobPostingId: new Types.ObjectId(jobPostingId) };
    if (options?.status) filter.status = options.status;
    return Candidate.find(filter).sort({ matchScore: -1, createdAt: -1 }).lean();
  }

  async count(filter: QueryFilter<ICandidate> = {}) {
    return Candidate.countDocuments(filter);
  }

  async countByStatus(status: CandidateStatus) {
    return Candidate.countDocuments({ status });
  }

  async funnelCounts() {
    return Candidate.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  }
}

export const candidateRepository = new CandidateRepository();
