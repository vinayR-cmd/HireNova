import { User, IUser } from "@/lib/models";
//@ts-ignore
import { FilterQuery } from "mongoose";

export class UserRepository {
  async findById(id: string) {
    return User.findById(id).lean();
  }

  async findByIdWithPassword(id: string) {
    return User.findById(id).select("+password").lean();
  }

  async findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() }).lean();
  }

  async findByEmailWithPassword(email: string) {
    return User.findOne({ email: email.toLowerCase() }).select("+password").lean();
  }

  async create(data: Partial<IUser>) {
    const user = new User(data);
    return user.save();
  }

  async updateStatus(id: string, status: IUser["status"]) {
    return User.findByIdAndUpdate(id, { status }, { returnDocument: "after" }).lean();
  }

  async updatePassword(id: string, hashedPassword: string) {
    return User.findByIdAndUpdate(id, { password: hashedPassword }, { returnDocument: "after" }).lean();
  }

  async findAll(filter: FilterQuery<IUser> = {}) {
    return User.find(filter).lean();
  }
}

export const userRepository = new UserRepository();
