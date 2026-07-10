import * as Burnt from 'burnt';
import { useAppToast } from './toast-card';

export interface AlertPayload {
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Global native alert trigger for Gida.
 * Replaces the temporary native alert dialog with buttery-smooth OS notification banners.
 */
const { showToast } = useAppToast();
export const showAlert = ({ title, message, type }: AlertPayload) => {
  showToast({ title, message, type });
};