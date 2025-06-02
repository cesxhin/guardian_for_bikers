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
export class GroupConflict extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GroupConflict";
    }
}
export class UserNotFound extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserNotFound";
    }
}
export class UserErrorGeneric extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserErrorGeneric";
    }
}
export class UserConflict extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserConflict";
    }
}