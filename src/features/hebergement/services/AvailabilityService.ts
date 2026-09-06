export class AvailabilityService {
  private static reservedDates = new Map<
    string,
    { start: Date; end: Date }[]
  >();

  static async checkAvailability(
    accommodationId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<boolean> {
    const requestedStart = new Date(checkIn);
    const requestedEnd = new Date(checkOut);

    if (requestedEnd <= requestedStart) return false;

    const ranges = this.reservedDates.get(accommodationId) || [];

    for (const range of ranges) {
      if (requestedStart < range.end && requestedEnd > range.start) {
        return false;
      }
    }

    return true;
  }

  static async reserveDates(
    accommodationId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<void> {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const ranges = this.reservedDates.get(accommodationId) || [];
    ranges.push({ start, end });
    this.reservedDates.set(accommodationId, ranges);
  }
}
