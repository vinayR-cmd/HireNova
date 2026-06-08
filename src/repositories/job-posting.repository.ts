import { JobPosting, IJobPosting, JobPostingStatus } from "@/lib/models";
import { QueryFilter, UpdateQuery } from "mongoose";

export class JobPostingRepository {
  async findById(id: string) {
    return JobPosting.findById(id).lean();
  }

  async create(data: Partial<IJobPosting>) {
    const posting = new JobPosting(data);
    return posting.save();
  }

  async update(id: string, data: UpdateQuery<IJobPosting>) {
    return JobPosting.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true }).lean();
  }

  async findAll(filter: QueryFilter<IJobPosting> = {}, options?: { skip?: number; limit?: number }) {
    let query = JobPosting.find(filter).sort({ createdAt: -1 });
    if (options?.skip) query = query.skip(options.skip);
    if (options?.limit) query = query.limit(options.limit);
    return query.lean();
  }

  async count(filter: QueryFilter<IJobPosting> = {}) {
    return JobPosting.countDocuments(filter);
  }

  async countByStatus(status: JobPostingStatus) {
    return JobPosting.countDocuments({ status });
  }
}

export const jobPostingRepository = new JobPostingRepository();
