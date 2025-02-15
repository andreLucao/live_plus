'use client'
import React, { useState, useEffect } from "react";
import AppointmentForm from "./appointment-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DoctorList({ tenant }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch(`/api/${tenant}/usuarios`);
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const data = await response.json();
        // Filter users to only include those with role "doctor"
        const doctorUsers = data.filter(user => user.role === "doctor");
        setDoctors(doctorUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [tenant]);

  if (loading) {
    return <div className="p-4">Loading doctors...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>
          Error loading doctors: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctors.map((doctor) => (
            <TableRow key={doctor._id}>
              <TableCell>{doctor.email}</TableCell>
              <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(doctor.lastLoginAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button 
                  onClick={() => setSelectedDoctor(doctor)} 
                  variant="outline"
                >
                  Schedule Appointment
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {doctors.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          No doctors found
        </div>
      )}

      <AppointmentForm 
        doctor={selectedDoctor} 
        onClose={() => setSelectedDoctor(null)} 
      />
    </div>
  );
}