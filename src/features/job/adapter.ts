import type { ModuleAdapter } from "../../core/sdk/types";

export const adapter: ModuleAdapter = {
  toModel: (formData: any) => ({
    title: formData.title,
    description: formData.description,
    company: formData.company,
    companyLogo: formData.companyLogo,
    category: formData.category || "général",
    contractType: formData.contract,
    salaryMin: formData.salaryMin,
    salaryMax: formData.salaryMax,
    currency: formData.currency || "USD",
    city: formData.city,
    remote: formData.remote ?? false,
    skills: formData.skills || [],
    deadline: formData.deadline
      ? new Date(formData.deadline).toISOString()
      : undefined,
  }),
  fromModel: (model: any) => ({
    title: model.title,
    description: model.description,
    company: model.company,
    companyLogo: model.companyLogo,
    category: model.category,
    contract: model.contractType,
    salaryMin: model.salaryMin,
    salaryMax: model.salaryMax,
    currency: model.currency,
    city: model.city,
    remote: model.remote,
    skills: model.skills,
    deadline: model.deadline ? new Date(model.deadline).getTime() : undefined,
  }),
  normalize: async (data: any) => {
    if (data.salary && typeof data.salary === "string") {
      data.salary = parseFloat(data.salary);
    }
    return data;
  },
  validate: (data: any) => {
    const errors: string[] = [];
    if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
      errors.push("Le salaire minimum ne peut pas être supérieur au maximum");
    }
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  serialize: (data: any) => JSON.stringify(data),
  deserialize: (data: any) => JSON.parse(data),
};
