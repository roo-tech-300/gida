import { ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import type { ListingVideo } from '@/types/listing-video';
import { VideoRowLayout } from './video-row-layout';

const STATUS_LABEL: Record<ListingVideo['status'], string> = {
  queued: 'Waiting to process…',
  processing: 'Processing — usually under 2 minutes',
  ready: 'Live on the listing',
  failed: 'Failed',
};

type Props = {
  video: ListingVideo;
  index: number;
  isDeleting: boolean;
  onDelete: () => void;
};

export function ListingVideoRow({ video, index, isDeleting, onDelete }: Props) {
  const pending = video.status === 'queued' || video.status === 'processing';

  return (
    <VideoRowLayout
      thumbnail={
        video.posterUrl ? (
          <Image source={{ uri: video.posterUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : pending ? (
          <ActivityIndicator color={DesignColors.primary} />
        ) : (
          <Ionicons name="alert-circle-outline" size={24} color={DesignColors.danger} />
        )
      }
      durationSeconds={video.durationSeconds}
      title={`Walkthrough #${index + 1}`}
      status={video.status === 'failed' && video.error ? video.error : STATUS_LABEL[video.status]}
      statusFailed={video.status === 'failed'}
      removeIcon="trash-outline"
      removeLabel={`Delete walkthrough ${index + 1}`}
      isRemoving={isDeleting}
      onRemove={onDelete}
    />
  );
}
