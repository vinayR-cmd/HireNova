import { CustomDay, ICustomDay } from "@/lib/models";
import { startOfDay, endOfDay } from "date-fns";

export class CustomDayRepository {
  async findByDate(date: Date) {
    const day = startOfDay(new Date(date));
    return CustomDay.findOne({ date: day }).lean();
  }

  async findRange(startDate: Date, endDate: Date) {
    return CustomDay.find({
      date: { $gte: startOfDay(startDate), $lte: endOfDay(endDate) },
    })
      .sort({ date: 1 })
      .lean();
  }

  async upsert(date: Date, data: Partial<ICustomDay>) {
    const day = startOfDay(new Date(date));
    return CustomDay.findOneAndUpdate(
      { date: day },
      { ...data, date: day },
      { upsert: true, new: true, returnDocument: "after" }
    ).lean();
  }

  async delete(date: Date) {
    const day = startOfDay(new Date(date));
    return CustomDay.findOneAndDelete({ date: day }).lean();
  }
}

export const customDayRepository = new CustomDayRepository();
