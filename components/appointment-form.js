import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AppointmentForm({ doctor, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientEmail: "",
    dateTime: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: doctor?.id,
          doctorName: doctor?.name,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule appointment");
      }

      toast.success("Appointment scheduled successfully!", {
        description: `Your meeting link: ${data.meetLink}`,
      });
      onClose();
    } catch (error) {
      toast.error("Failed to schedule appointment");
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Doctor</Label>
            <Input value={doctor.name || ""} disabled />
          </div>
          <div>
            <Label>Specialization</Label>
            <Input value={doctor.specialization || ""} disabled />
          </div>
          <div>
            <Label>CRM</Label>
            <Input value={doctor.crm || ""} disabled />
          </div>
          <div>
            <Label htmlFor="patientEmail">Patient Email</Label>
            <Input
              id="patientEmail"
              type="email"
              required
              value={formData.patientEmail}
              onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="dateTime">Date and Time</Label>
            <Input
              id="dateTime"
              type="datetime-local"
              required
              value={formData.dateTime}
              onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}