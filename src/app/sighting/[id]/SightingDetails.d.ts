import { FC } from 'react';
import { Sighting } from '@/types/sighting';

interface SightingDetailsProps {
  sighting: Sighting | null;
}

declare const SightingDetails: FC<SightingDetailsProps>;

export default SightingDetails; 