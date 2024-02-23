export interface destination {
  includes(): boolean;
  forEach(arg0: any): boolean;
  destination: string;
  description: string;
  imageUrl: string;
  type: string;
  _ownerId: any;
  _createdOn: number;
  _id: string;
  likes: string[];
  comments: Comment[];
}
