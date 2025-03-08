import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from '../api/api';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  contact: string;
  availability: string;
  price: number;
}

interface Props {
  navigation: NavigationProp<any>;
}

const { width } = Dimensions.get('window');

const TelemedicineAppointment: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
 

  const healthIssues = ['Common Cold', 'Allergies', 'Skin Conditions', 'Mental Health', 'Chronic Disease Management'];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/doctors`);
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueSelection = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAppointmentDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setAppointmentTime(selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/appointments`, {
        issues: selectedIssues,
        doctorId: selectedDoctor?.id,
        date: appointmentDate,
        time: appointmentTime,
        email,
        patientName,
        paymentMethod,
        paymentDetails
      });

      if (response.data.success) {
        setPaymentStatus(true);
        setRoomCode(response.data.roomCode);
        setStep(5);
      } else {
        Alert.alert('Error', 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((stepNumber) => (
          <View key={stepNumber} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              stepNumber <= step ? styles.progressDotActive : styles.progressDotInactive
            ]} />
            {stepNumber < 5 && <View style={[
              styles.progressLine,
              stepNumber < step ? styles.progressLineActive : styles.progressLineInactive
            ]} />}
          </View>
        ))}
      </View>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.cardHeader}>What brings you in today?</Text>
              <Text style={styles.cardSubHeader}>Select all that apply</Text>
              {healthIssues.map(issue => (
                <TouchableOpacity
                  key={issue}
                  style={[
                    styles.issueButton,
                    selectedIssues.includes(issue) && styles.selectedIssueButton
                  ]}
                  onPress={() => handleIssueSelection(issue)}
                >
                  <Text style={[
                    styles.issueButtonText,
                    selectedIssues.includes(issue) && styles.selectedIssueButtonText
                  ]}>{issue}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.nextButton, selectedIssues.length === 0 && styles.disabledButton]}
              onPress={() => setStep(2)}
              disabled={selectedIssues.length === 0}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Available Specialists</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : (
              doctors.map(doctor => (
                <TouchableOpacity
                  key={doctor.id}
                  style={[
                    styles.doctorCard,
                    selectedDoctor?.id === doctor.id && styles.selectedDoctorCard
                  ]}
                  onPress={() => setSelectedDoctor(doctor)}
                >
                  <View style={styles.doctorAvatarContainer}>
                    <View style={styles.doctorAvatar}>
                      <Text style={styles.doctorAvatarText}>
                        {doctor.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text>
                    <Text style={styles.doctorAvailability}>{doctor.availability}</Text>
                    <Text style={styles.doctorPrice}>${doctor.price}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={[styles.nextButton, !selectedDoctor && styles.disabledButton]}
              onPress={() => setStep(3)}
              disabled={!selectedDoctor}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 3:
        return (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Schedule Appointment</Text>
              <Text style={styles.doctorName}>with Dr. {selectedDoctor?.name}</Text>

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {appointmentDate || 'Select Date'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {appointmentTime || 'Select Time'}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>

            <TouchableOpacity
              style={[styles.nextButton, (!appointmentDate || !appointmentTime) && styles.disabledButton]}
              onPress={() => setStep(4)}
              disabled={!appointmentDate || !appointmentTime}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 4:
        return (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Payment Details</Text>
              
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Appointment Summary</Text>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Doctor:</Text>
                  <Text style={styles.summaryValue}>{selectedDoctor?.name}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Date:</Text>
                  <Text style={styles.summaryValue}>{appointmentDate}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Time:</Text>
                  <Text style={styles.summaryValue}>{appointmentTime}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Amount:</Text>
                  <Text style={styles.summaryValue}>${selectedDoctor?.price}</Text>
                </View>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={patientName}
                onChangeText={setPatientName}
                placeholderTextColor="#6c757d"
              />

              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#6c757d"
              />

              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethodsContainer}>
                {['paypal', 'card', 'mpesa'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentMethodButton,
                      paymentMethod === method && styles.selectedPaymentMethodButton
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text style={[
                      styles.paymentMethodText,
                      paymentMethod === method && styles.selectedPaymentMethodText
                    ]}>
                      {method.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {paymentMethod && (
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${paymentMethod} details`}
                  value={paymentDetails}
                  onChangeText={setPaymentDetails}
                  placeholderTextColor="#6c757d"
                  secureTextEntry={paymentMethod === 'card'}
                />
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.nextButton,
                (!paymentDetails || !email || !patientName) && styles.disabledButton
              ]}
              onPress={handlePayment}
              disabled={!paymentDetails || !email || !patientName || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextButtonText}>Pay ${selectedDoctor?.price}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        );

      case 5:
        return (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.successCard}>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>✓</Text>
              </View>
              <Text style={styles.successHeader}>Appointment Confirmed!</Text>
              <View style={styles.successDetails}>
                <Text style={styles.successText}>Your appointment is scheduled with</Text>
                <Text style={styles.successDoctorName}>Dr. {selectedDoctor?.name}</Text>
                <Text style={styles.successDate}>{appointmentDate} at {appointmentTime}</Text>
                <View style={styles.roomCodeContainer}>
                  <Text style={styles.roomCodeLabel}>Room Code:</Text>
                  <Text style={styles.roomCode}>{roomCode}</Text>
                </View>
                <Text style={styles.successEmail}>
                  Confirmation sent to {email}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.videoButton}
                onPress={() => navigation.navigate('VideoRoom', { roomCode })}
              >
                <Text style={styles.videoButtonText}>Join Video Call</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return(
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Telemedicine</Text>
          {renderProgressBar()}
        </View>
        {renderStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff', // White background
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff', // White
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Light gray for subtle border
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Black
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotActive: {
    backgroundColor: '#ff69b4', // Pink
  },
  progressDotInactive: {
    backgroundColor: '#f0f0f0', // Light gray
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#ff69b4', // Pink
  },
  progressLineInactive: {
    backgroundColor: '#f0f0f0', // Light gray
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff', // White
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000', // Black shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000', // Black
    marginBottom: 8,
  },
  cardSubHeader: {
    fontSize: 14,
    color: '#666666', // Dark gray
    marginBottom: 16,
  },
  issueButton: {
    backgroundColor: '#ffffff', // White
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Light gray border
  },
  selectedIssueButton: {
    backgroundColor: '#fff0f5', // Very light pink
    borderColor: '#ff69b4', // Pink
  },
  issueButtonText: {
    fontSize: 16,
    color: '#000000', // Black
    fontWeight: '500',
  },
  selectedIssueButtonText: {
    color: '#ff69b4', // Pink
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000', // Black
    marginBottom: 16,
  },
  doctorCard: {
    backgroundColor: '#ffffff', // White
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000', // Black shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedDoctorCard: {
    borderWidth: 2,
    borderColor: '#ff69b4', // Pink
  },
  doctorAvatarContainer: {
    marginRight: 16,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff0f5', // Very light pink
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff69b4', // Pink
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666666', // Dark gray
    marginBottom: 4,
  },
  doctorAvailability: {
    fontSize: 14,
    color: '#ff69b4', // Pink for availability
    marginBottom: 4,
  },
  doctorPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000', // Black
  },
  datePickerButton: {
    backgroundColor: '#ffffff', // White
    borderWidth: 1,
    borderColor: '#f0f0f0', // Light gray
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#000000', // Black
  },
  input: {
    backgroundColor: '#ffffff', // White
    borderWidth: 1,
    borderColor: '#f0f0f0', // Light gray
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#000000', // Black
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paymentMethodButton: {
    flex: 1,
    backgroundColor: '#ffffff', // White
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Light gray
    alignItems: 'center',
  },
  selectedPaymentMethodButton: {
    backgroundColor: '#fff0f5', // Very light pink
    borderColor: '#ff69b4', // Pink
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000', // Black
  },
  selectedPaymentMethodText: {
    color: '#ff69b4', // Pink
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000', // Black
    marginBottom: 12,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666', // Dark gray
  },
  summaryValue: {
    fontSize: 14,
    color: '#000000', // Black
    fontWeight: '500',
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  
  content: {
    flex: 1,
  },

  nextButton: {
    backgroundColor: '#ff69b4', // Pink
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
    marginBottom: 20, // Add extra bottom margin
  },
  nextButtonText: {
    color: '#ffffff', // White
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0', // Light gray
  },
  loader: {
    marginVertical: 20,
  },
  successCard: {
    backgroundColor: '#ffffff', // White
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000', // Black shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff69b4', // Pink
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    color: '#ffffff', // White
  },
  successHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Black
    marginBottom: 16,
  },
  successDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successText: {
    fontSize: 16,
    color: '#666666', // Dark gray
    marginBottom: 8,
  },
  successDoctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black
    marginBottom: 8,
  },
  successDate: {
    fontSize: 16,
    color: '#000000', // Black
    marginBottom: 16,
  },
  roomCodeContainer: {
    backgroundColor: '#fff0f5', // Very light pink
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  roomCodeLabel: {
    fontSize: 14,
    color: '#666666', // Dark gray
    marginBottom: 4,
  },
  roomCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff69b4', // Pink
  },
  successEmail: {
    fontSize: 14,
    color: '#666666', // Dark gray
  },
  videoButton: {
    backgroundColor: '#ff69b4', // Pink
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  videoButtonText: {
    color: '#ffffff', // White
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TelemedicineAppointment;