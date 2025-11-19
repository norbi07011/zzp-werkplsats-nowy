import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface ProjectEvent {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  event_type:
    | "meeting"
    | "deadline"
    | "milestone"
    | "inspection"
    | "delivery"
    | "other";
  start_date: string;
  end_date: string;
  location?: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_rule?: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  response: "pending" | "accepted" | "declined" | "tentative";
  responded_at?: string;
  created_at: string;
}

export function useProjectEvents(projectId?: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events
  const fetchEvents = async (startDate?: string, endDate?: string) => {
    if (!projectId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from("project_events")
        .select("*")
        .eq("project_id", projectId);

      if (startDate && endDate) {
        query = query.gte("start_date", startDate).lte("start_date", endDate);
      }

      const { data, error: fetchError } = await query.order("start_date", {
        ascending: true,
      });

      if (fetchError) throw fetchError;
      setEvents(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create event
  const createEvent = async (eventData: Partial<ProjectEvent>) => {
    try {
      const { data, error: createError } = await supabase
        .from("project_events")
        .insert([
          {
            ...eventData,
            project_id: projectId,
            created_by: user?.id,
            event_type: eventData.event_type || "other",
            is_all_day: eventData.is_all_day || false,
            is_recurring: eventData.is_recurring || false,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      setEvents((prev) =>
        [...prev, data].sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        )
      );
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Update event
  const updateEvent = async (
    eventId: string,
    updates: Partial<ProjectEvent>
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from("project_events")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId)
        .select()
        .single();

      if (updateError) throw updateError;

      setEvents((prev) =>
        prev
          .map((e) => (e.id === eventId ? data : e))
          .sort(
            (a, b) =>
              new Date(a.start_time).getTime() -
              new Date(b.start_time).getTime()
          )
      );
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("project_events")
        .delete()
        .eq("id", eventId);

      if (deleteError) throw deleteError;

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch attendees
  const fetchAttendees = async (eventId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("event_participants")
        .select("*")
        .eq("event_id", eventId);

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      console.error("Error fetching attendees:", err);
      return [];
    }
  };

  // Add attendee
  const addAttendee = async (eventId: string, userId: string) => {
    try {
      const { data, error: createError } = await supabase
        .from("event_participants")
        .insert([
          {
            event_id: eventId,
            user_id: userId,
            response: "pending",
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      return data;
    } catch (err: any) {
      console.error("Error adding attendee:", err);
      throw err;
    }
  };

  // Update attendee response
  const updateAttendeeResponse = async (
    attendeeId: string,
    status: "accepted" | "declined" | "tentative"
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from("event_participants")
        .update({
          response: status,
          responded_at: new Date().toISOString(),
        })
        .eq("id", attendeeId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    } catch (err: any) {
      console.error("Error updating attendee response:", err);
      throw err;
    }
  };

  // Get events for current month
  const getMonthEvents = async (year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    await fetchEvents(startDate, endDate);
  };

  useEffect(() => {
    fetchEvents();
  }, [projectId]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchAttendees,
    addAttendee,
    updateAttendeeResponse,
    getMonthEvents,
  };
}
