import { companyRepository } from "@/repositories/company.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { ICompany } from "@/lib/models";

export class SettingsService {
  /**
   * Extracts top-level tenant parameter configurations.
   */
  async getCompanyConfigurationSettings() {
    let settings = await companyRepository.get();
    if (!settings) {
      // Lazily instantiate a default company metadata object context if none exists
      settings = await companyRepository.upsert({
        name: "Enterprise Core Hub",
        overtimeMultiplier: 1.5,
        pfPercentage: 12.0,
        taxPercentage: 10.0,
        workingHoursPolicy: {
          name: "Standard Corporate Shift Policy",
          officeStartTime: "09:00",
          officeEndTime: "18:00",
          workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          weeklyOff: ["Saturday", "Sunday"],
          totalDailyHours: 9,
        },
      });
    }
    return settings;
  }

  /**
   * Enforces modifications to organizational settings and updates security tracking logs.
   */
  async updateCompanyConfiguration(adminUserId: string, adjustmentPayload: Partial<ICompany>) {
    const modifiedSettings = await companyRepository.update(adjustmentPayload);

    await auditRepository.log(
      adminUserId,
      "COMPANY_SETTINGS_UPDATED",
      "Corporate master settings, fiscal ledger percentages, or workspace hour limits updated."
    );

    return modifiedSettings;
  }
}

export const settingsService = new SettingsService();