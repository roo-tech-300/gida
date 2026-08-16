import type { SlotCredit, Pod } from '@/types/liquidity';
import { MOCK_SLOT_CREDITS, MOCK_PODS } from '@/dummy/liquidity-mock';

let localUserCredits: SlotCredit[] = [...MOCK_SLOT_CREDITS];
let localPods: Pod[] = [...MOCK_PODS];

export function getLocalCredits(): SlotCredit[] {
  return localUserCredits;
}

export function getLocalPods(): Pod[] {
  return localPods;
}

export function addCredit(credit: SlotCredit) {
  localUserCredits = [credit, ...localUserCredits];
}

export function addPod(pod: Pod) {
  localPods = [pod, ...localPods];
}

export function upsertPod(pod: Pod) {
  if (localPods.some((p) => p.id === pod.id)) {
    localPods = localPods.map((p) => (p.id === pod.id ? pod : p));
  } else {
    localPods = [pod, ...localPods];
  }
}

export function updateCredit(creditId: string, patch: Partial<SlotCredit>) {
  localUserCredits = localUserCredits.map((c) => (c.id === creditId ? { ...c, ...patch } : c));
  return localUserCredits.find((c) => c.id === creditId);
}

export function updatePod(podId: string, patch: Partial<Pod>) {
  localPods = localPods.map((p) => (p.id === podId ? { ...p, ...patch } : p));
  return localPods.find((p) => p.id === podId);
}

export function removeLocalCredit(creditId: string) {
  localUserCredits = localUserCredits.filter((c) => c.id !== creditId);
}

export function removeLocalPod(podId: string) {
  localPods = localPods.filter((p) => p.id !== podId);
}

export function resetLocalLiquidityState() {
  localUserCredits = [...MOCK_SLOT_CREDITS];
  localPods = [...MOCK_PODS];
}
