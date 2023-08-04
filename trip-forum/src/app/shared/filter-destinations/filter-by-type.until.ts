import { destination } from 'src/app/types/destination';

export function filterDestinationsByType(
  destinations: destination[],
  type: string
): destination[] {
  return destinations.filter((destination) => destination.type === type);
}
