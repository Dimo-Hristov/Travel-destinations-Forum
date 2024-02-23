import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DestinationService } from 'src/app/destination/destination.service';
import { destination } from 'src/app/types/destination';

export function sortDestinationsByLikes(
  destinations: destination[],
  destinationService: DestinationService
): Observable<destination[]> {
  const likesRequests = destinations.map((destination) =>
    destinationService.getDestinationLikesCount(destination._id)
  );

  return forkJoin(likesRequests).pipe(
    map((likesCounts: any) => {
      destinations.forEach((destination, index) => {
        destination.likes = likesCounts[index];
      });

      return destinations.sort(
        (a: destination, b: destination) => b.likes - a.likes
      );
    })
  );
}
