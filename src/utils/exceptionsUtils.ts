export class GroupNotFound extends Error {
    constructor(message: string) {
      super(message);
      this.name = "GroupNotFound";
    }
}
export class GroupErrorGeneric extends Error {
    constructor(message: string) {
      super(message);
      this.name = "GroupErrorGeneric";
    }
}