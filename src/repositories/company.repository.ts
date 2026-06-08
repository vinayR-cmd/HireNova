import { Company, ICompany } from "@/lib/models";
import { UpdateQuery } from "mongoose";
import { startOfDay } from "date-fns";

export class CompanyRepository {
  async get() {
    return Company.findOne().lean();
  }

  async upsert(data: Partial<ICompany>) {
    return Company.findOneAndUpdate({}, data, { upsert: true, returnDocument: "after" }).lean();
  }

  async update(data: UpdateQuery<ICompany>) {
    return Company.findOneAndUpdate({}, data, { new: true, upsert: true }).lean();
  }

  async addHoliday(date: Date, name: string) {
    const day = startOfDay(date);
    return Company.findOneAndUpdate(
      {},
      { $push: { holidays: { date: day, name } } },
      { new: true, upsert: true }
    ).lean();
  }

  async removeHoliday(date: Date) {
    const day = startOfDay(date);
    return Company.findOneAndUpdate(
      {},
      { $pull: { holidays: { date: day } } },
      { returnDocument: "after" }
    ).lean();
  }

  async getHolidays() {
    const company = await Company.findOne({}, { holidays: 1 }).lean();
    return company?.holidays ?? [];
  }
}

export const companyRepository = new CompanyRepository();
