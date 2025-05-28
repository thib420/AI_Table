import { graphClientService } from '../core/GraphClientService';
import { Event } from '@microsoft/microsoft-graph-types';

export class CalendarService {
  private readonly baseEndpoint = '/me/events';

  // Helper function to escape single quotes for OData
  private escapeODataString(str: string): string {
    return str.replace(/'/g, "''");
  }

  // Get calendar events
  async getEvents(options?: {
    startTime?: string;
    endTime?: string;
    top?: number;
    orderBy?: string;
  }): Promise<Event[]> {
    let filter = '';
    if (options?.startTime && options?.endTime) {
      filter = `start/dateTime ge '${options.startTime}' and end/dateTime le '${options.endTime}'`;
    } else if (options?.startTime) {
      filter = `start/dateTime ge '${options.startTime}'`;
    }

    return await graphClientService.makePaginatedRequest<Event>(this.baseEndpoint, {
      select: [
        'id', 'subject', 'start', 'end', 'location', 'attendees',
        'organizer', 'body', 'importance', 'showAs', 'isAllDay',
        'createdDateTime', 'lastModifiedDateTime'
      ],
      filter: filter || undefined,
      orderBy: options?.orderBy || 'start/dateTime',
      top: options?.top || 100,
      maxPages: 3
    });
  }

  // Get a specific event
  async getEvent(eventId: string): Promise<Event> {
    return await graphClientService.makeRequest<Event>(`${this.baseEndpoint}/${eventId}`, {
      select: [
        'id', 'subject', 'start', 'end', 'location', 'attendees',
        'organizer', 'body', 'importance', 'showAs', 'isAllDay',
        'createdDateTime', 'lastModifiedDateTime', 'webLink'
      ]
    });
  }

  // Get upcoming events (next 30 days)
  async getUpcomingEvents(days: number = 30): Promise<Event[]> {
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    return await this.getEvents({
      startTime,
      endTime,
      orderBy: 'start/dateTime'
    });
  }

  // Get today's events
  async getTodaysEvents(): Promise<Event[]> {
    const today = new Date();
    const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    return await this.getEvents({
      startTime,
      endTime,
      orderBy: 'start/dateTime'
    });
  }

  // Get events with specific attendee
  async getEventsWithAttendee(attendeeEmail: string): Promise<Event[]> {
    const events = await this.getEvents({
      top: 200
    });

    return events.filter(event =>
      event.attendees?.some(attendee =>
        attendee.emailAddress?.address?.toLowerCase() === attendeeEmail.toLowerCase()
      )
    );
  }

  // Search events
  async searchEvents(searchTerm: string): Promise<Event[]> {
    const escapedTerm = this.escapeODataString(searchTerm);
    return await graphClientService.makePaginatedRequest<Event>(this.baseEndpoint, {
      filter: `contains(subject,'${escapedTerm}') or contains(body/content,'${escapedTerm}')`,
      select: [
        'id', 'subject', 'start', 'end', 'location', 'attendees',
        'organizer', 'body', 'importance'
      ],
      orderBy: 'start/dateTime desc',
      top: 50,
      maxPages: 2
    });
  }

  // Create a new event
  async createEvent(event: {
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location?: { displayName: string };
    attendees?: { emailAddress: { address: string; name?: string } }[];
    body?: { content: string; contentType: 'text' | 'html' };
    importance?: 'low' | 'normal' | 'high';
  }): Promise<Event> {
    return await graphClientService.makeRequest<Event>(this.baseEndpoint, {
      method: 'POST',
      body: event
    });
  }

  // Update an event
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    return await graphClientService.makeRequest<Event>(`${this.baseEndpoint}/${eventId}`, {
      method: 'PATCH',
      body: updates
    });
  }

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    await graphClientService.makeRequest(`${this.baseEndpoint}/${eventId}`, {
      method: 'DELETE'
    });
  }

  // Get events by location
  async getEventsByLocation(location: string): Promise<Event[]> {
    return await graphClientService.makePaginatedRequest<Event>(this.baseEndpoint, {
      filter: `contains(location/displayName,'${this.escapeODataString(location)}')`,
      select: [
        'id', 'subject', 'start', 'end', 'location', 'attendees',
        'organizer', 'importance'
      ],
      orderBy: 'start/dateTime',
      top: 100,
      maxPages: 2
    });
  }

  // Get high importance events
  async getHighImportanceEvents(): Promise<Event[]> {
    return await graphClientService.makePaginatedRequest<Event>(this.baseEndpoint, {
      filter: 'importance eq \'high\'',
      select: [
        'id', 'subject', 'start', 'end', 'location', 'attendees',
        'organizer', 'importance'
      ],
      orderBy: 'start/dateTime',
      top: 50,
      maxPages: 2
    });
  }

  // Get events organized by current user
  async getMyOrganizedEvents(): Promise<Event[]> {
    const currentUser = await graphClientService.getCurrentUser();
    const userEmail = currentUser.mail || currentUser.userPrincipalName;

    return await graphClientService.makePaginatedRequest<Event>(this.baseEndpoint, {
      filter: `organizer/emailAddress/address eq '${this.escapeODataString(userEmail)}'`,
      select: [
        'id', 'subject', 'start', 'end', 'location', 'attendees',
        'organizer', 'importance'
      ],
      orderBy: 'start/dateTime desc',
      top: 100,
      maxPages: 3
    });
  }

  // Get recurring events
  async getRecurringEvents(): Promise<Event[]> {
    return await graphClientService.makePaginatedRequest<Event>(this.baseEndpoint, {
      filter: 'recurrence ne null',
      select: [
        'id', 'subject', 'start', 'end', 'location', 'recurrence',
        'organizer', 'importance'
      ],
      orderBy: 'start/dateTime',
      top: 50,
      maxPages: 2
    });
  }

  // Get free/busy information for a user
  async getFreeBusy(userEmail: string, startTime: string, endTime: string): Promise<any> {
    return await graphClientService.makeRequest('/me/calendar/getSchedule', {
      method: 'POST',
      body: {
        schedules: [userEmail],
        startTime: {
          dateTime: startTime,
          timeZone: 'UTC'
        },
        endTime: {
          dateTime: endTime,
          timeZone: 'UTC'
        },
        availabilityViewInterval: 60
      }
    });
  }

  // Find meeting times
  async findMeetingTimes(attendees: string[], duration: number = 60): Promise<any> {
    return await graphClientService.makeRequest('/me/calendar/findMeetingTimes', {
      method: 'POST',
      body: {
        attendees: attendees.map(email => ({
          emailAddress: { address: email }
        })),
        timeConstraint: {
          timeslots: [{
            start: {
              dateTime: new Date().toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              timeZone: 'UTC'
            }
          }]
        },
        meetingDuration: `PT${duration}M`,
        maxCandidates: 20
      }
    });
  }

  // Get calendar view (events in a specific time range)
  async getCalendarView(startTime: string, endTime: string): Promise<Event[]> {
    return await graphClientService.makePaginatedRequest<Event>('/me/calendarView', {
      filter: `start/dateTime ge '${startTime}' and end/dateTime le '${endTime}'`,
      select: [
        'id', 'subject', 'start', 'end', 'location', 'attendees',
        'organizer', 'importance', 'showAs'
      ],
      orderBy: 'start/dateTime',
      top: 200,
      maxPages: 3
    });
  }

  // Get meeting statistics for CRM insights
  async getMeetingStatistics(days: number = 30): Promise<{
    totalMeetings: number;
    totalHours: number;
    averageMeetingDuration: number;
    meetingsByAttendeeCount: { [key: string]: number };
    topAttendees: { email: string; count: number }[];
  }> {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const endTime = new Date().toISOString();

    const events = await this.getEvents({ startTime, endTime, top: 500 });

    const totalMeetings = events.length;
    let totalMinutes = 0;
    const attendeeCount: { [email: string]: number } = {};
    const meetingsByAttendeeCount: { [key: string]: number } = {};

    events.forEach(event => {
      if (event.start?.dateTime && event.end?.dateTime) {
        const duration = new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime();
        totalMinutes += duration / (1000 * 60);
      }

      const attendeeCountForEvent = event.attendees?.length || 0;
      const key = `${attendeeCountForEvent} attendees`;
      meetingsByAttendeeCount[key] = (meetingsByAttendeeCount[key] || 0) + 1;

      event.attendees?.forEach(attendee => {
        const email = attendee.emailAddress?.address;
        if (email) {
          attendeeCount[email] = (attendeeCount[email] || 0) + 1;
        }
      });
    });

    const topAttendees = Object.entries(attendeeCount)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalMeetings,
      totalHours: totalMinutes / 60,
      averageMeetingDuration: totalMeetings > 0 ? totalMinutes / totalMeetings : 0,
      meetingsByAttendeeCount,
      topAttendees
    };
  }
}

export const calendarService = new CalendarService(); 