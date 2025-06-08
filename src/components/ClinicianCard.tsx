import React, { useState } from 'react';
import { 
  User, 
  Stethoscope, 
  GraduationCap, 
  Award, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Shield,
  Star,
  Clock,
  Building2
} from 'lucide-react';

interface ClinicianData {
  clinician_id: string;
  first_name: string;
  last_name: string;
  title: string;
  specialty: string;
  subspecialty?: string;
  license_number: string;
  npi: string;
  dea_number?: string;
  board_certification: string;
  medical_school: string;
  residency_program: string;
  fellowship?: string;
  years_experience: number;
  employment_status: string;
  department: string;
  image_url?: string;
}

interface ClinicianCardProps {
  clinician: ClinicianData;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const ClinicianCard: React.FC<ClinicianCardProps> = ({ 
  clinician, 
  isExpanded = false, 
  onToggle 
}) => {
  const [imageError, setImageError] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'on leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExperienceLevel = (years: number) => {
    if (years < 5) return { level: 'Early Career', color: 'text-blue-600' };
    if (years < 10) return { level: 'Experienced', color: 'text-green-600' };
    if (years < 15) return { level: 'Senior', color: 'text-purple-600' };
    return { level: 'Expert', color: 'text-orange-600' };
  };

  const experienceInfo = getExperienceLevel(clinician.years_experience);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Clinician Image */}
            <div className="relative">
              {clinician.image_url && !imageError ? (
                <img
                  src={clinician.image_url}
                  alt={`${clinician.first_name} ${clinician.last_name}`}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-white shadow-md">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {clinician.title} {clinician.first_name} {clinician.last_name}
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
                <Stethoscope className="w-4 h-4 mr-1" />
                {clinician.specialty}
                {clinician.subspecialty && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {clinician.subspecialty}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Building2 className="w-4 h-4 mr-1" />
                {clinician.department}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(clinician.employment_status)}`}>
              {clinician.employment_status}
            </div>
            <div className="mt-2 flex items-center justify-end space-x-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className={`text-sm font-medium ${experienceInfo.color}`}>
                {clinician.years_experience} years • {experienceInfo.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <div className="text-xs text-gray-600">License</div>
            <div className="text-sm font-medium text-gray-800">{clinician.license_number}</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Award className="w-5 h-5 mx-auto text-green-600 mb-1" />
            <div className="text-xs text-gray-600">NPI</div>
            <div className="text-sm font-medium text-gray-800">{clinician.npi}</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Star className="w-5 h-5 mx-auto text-yellow-600 mb-1" />
            <div className="text-xs text-gray-600">Experience</div>
            <div className="text-sm font-medium text-gray-800">{clinician.years_experience} years</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <GraduationCap className="w-5 h-5 mx-auto text-purple-600 mb-1" />
            <div className="text-xs text-gray-600">Board Cert</div>
            <div className="text-sm font-medium text-gray-800">Certified</div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50">
          <div className="pt-4 space-y-4">
            
            {/* Education & Training */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <GraduationCap className="w-4 h-4 mr-2 text-purple-600" />
                Education & Training
              </h4>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-800">Medical School</div>
                  <div className="text-sm text-gray-600">{clinician.medical_school}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-800">Residency</div>
                  <div className="text-sm text-gray-600">{clinician.residency_program}</div>
                </div>
                {clinician.fellowship && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-800">Fellowship</div>
                    <div className="text-sm text-gray-600">{clinician.fellowship}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Award className="w-4 h-4 mr-2 text-green-600" />
                Certifications & Licenses
              </h4>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-800">Board Certification</div>
                  <div className="text-sm text-gray-600">{clinician.board_certification}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-xs font-medium text-gray-700">License Number</div>
                    <div className="text-sm text-gray-800">{clinician.license_number}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-xs font-medium text-gray-700">NPI Number</div>
                    <div className="text-sm text-gray-800">{clinician.npi}</div>
                  </div>
                </div>
                {clinician.dea_number && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-800">DEA Number</div>
                    <div className="text-sm text-gray-600">{clinician.dea_number}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Stethoscope className="w-4 h-4 mr-2 text-blue-600" />
                Professional Summary
              </h4>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Primary Specialty:</span>
                    <div className="text-gray-600">{clinician.specialty}</div>
                  </div>
                  {clinician.subspecialty && (
                    <div>
                      <span className="font-medium text-gray-700">Subspecialty:</span>
                      <div className="text-gray-600">{clinician.subspecialty}</div>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <div className="text-gray-600">{clinician.department}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Years of Experience:</span>
                    <div className="text-gray-600">{clinician.years_experience} years ({experienceInfo.level})</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {onToggle && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onToggle}
            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {isExpanded ? 'Show Less' : 'View Full Profile'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClinicianCard;