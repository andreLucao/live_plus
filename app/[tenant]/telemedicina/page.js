import DoctorList from "@/components/doctorsList"

const mockDoctors = [
  {
    id: "1",
    name: "Dr. John Smith",
    specialization: "Cardiologist",
    crm: "CRM-123456",
  },
  {
    id: "2",
    name: "Dr. Sarah Johnson",
    specialization: "Dermatologist",
    crm: "CRM-789012",
  },
  
]

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Doctor Appointments</h1>
        <DoctorList doctors={mockDoctors} />
      </div>
    </main>
  )
}

