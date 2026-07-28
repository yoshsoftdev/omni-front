import { getEndpointRepository } from "@/features/automation/repositories/endpoint.repository";
import type {
  CreateEndpointInput,
  EndpointListQuery,
  UpdateEndpointInput,
} from "@/features/automation/types/endpoint";

const repository = getEndpointRepository();

export const endpointService = {
  getSummary: () => repository.getSummary(),
  list: (query?: EndpointListQuery) => repository.list(query),
  getById: (id: string) => repository.getById(id),
  create: (input: CreateEndpointInput) => repository.create(input),
  update: (id: string, patch: UpdateEndpointInput) => repository.update(id, patch),
  duplicate: (id: string) => repository.duplicate(id),
  enable: (id: string) => repository.setStatus(id, "active"),
  disable: (id: string) => repository.setStatus(id, "disabled"),
  remove: (id: string) => repository.remove(id),
  getAnalytics: (id: string) => repository.getAnalytics(id),
  invokeTest: (id: string, body: Record<string, unknown>) => repository.invokeTest(id, body),
};
