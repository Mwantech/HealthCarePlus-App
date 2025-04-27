import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
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
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [roomCode, setRoomCode] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [checkoutRequestID, setCheckoutRequestID] = useState<string>('');
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState<boolean>(false);
  // Add state for payment description
  const [paymentDescription, setPaymentDescription] = useState<string>('');
  const pollCount = React.useRef<number>(0);
 
  const healthIssues = ['Mental Health',
  'Anxiety and Depression',
  'Stress Management',
  'Insomnia and Sleep Disorders',
  'ADHD',
  'PTSD',
  'Medication Refills',
  'Lifestyle and Wellness Counseling',
  'Nutritional Counseling',
  'Smoking Cessation Programs',
  'Therapy and Counseling Sessions'];

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Poll payment status for M-Pesa
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (paymentMethod === 'mpesa' && paymentStatus === 'pending' && appointmentId) {
      // Initial check immediately
      checkPaymentStatus();
      
      // Then check every 5 seconds for the first 2 minutes
      intervalId = setInterval(() => {
        // Auto-stop polling after 2 minutes (24 attempts)
        if (pollCount.current >= 24) {
          clearInterval(intervalId);
          return;
        }
        
        checkPaymentStatus();
        pollCount.current += 1;
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentMethod, paymentStatus, appointmentId]);

  useEffect(() => {
    if (appointmentId) {
      pollCount.current = 0;
    }
  }, [appointmentId]);

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

  const checkPaymentStatus = async () => {
    if (checkingPaymentStatus || !appointmentId) return;
    
    try {
      setCheckingPaymentStatus(true);
      const response = await axios.get(`${BASE_URL}/payment-status/${appointmentId}`);
      
      if (response.data.success) {
        const newStatus = response.data.paymentStatus;
        setPaymentStatus(newStatus);
        
        // Store payment description if available
        if (response.data.description) {
          setPaymentDescription(response.data.description);
        }
        
        // Handle different payment statuses
        if (newStatus === 'completed') {
          // Payment is complete, fetch appointment details to get room code
          const appointmentResponse = await axios.get(`${BASE_URL}/appointments/${appointmentId}`);
          if (appointmentResponse.data.success) {
            setRoomCode(appointmentResponse.data.appointment.room_code);
            
            // Show success message
            Alert.alert(
              'Payment Successful',
              'Your payment has been processed successfully.'
            );
            
            // Move to confirmation screen
            setStep(5);
          }
        } else if (newStatus === 'failed') {
          // Payment failed
          Alert.alert(
            'Payment Failed',
            response.data.description || 'Your payment could not be processed. Please try again.'
          );
        } else if (newStatus === 'pending') {
          // Still pending, show message only if description is available
          if (response.data.description && response.data.description !== 'No status description available') {
            Alert.alert(
              'Payment Status',
              response.data.description
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      Alert.alert(
        'Error',
        'Could not check payment status. Please try again.'
      );
    } finally {
      setCheckingPaymentStatus(false);
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
        setPaymentStatus(response.data.paymentStatus);
        setRoomCode(response.data.roomCode);
        setAppointmentId(response.data.appointmentId);
        
        // Store additional fields from the response
        if (response.data.checkoutRequestID) {
          setCheckoutRequestID(response.data.checkoutRequestID);
        }
        
        if (response.data.description) {
          setPaymentDescription(response.data.description);
        }
        
        // For M-Pesa, stay on the payment screen until confirmation
        if (paymentMethod === 'mpesa' && response.data.paymentStatus === 'pending') {
          Alert.alert(
            'M-Pesa Payment',
            'Please check your phone for the M-Pesa prompt and enter your PIN to complete payment.'
          );
          
          // Reset polling count when starting a new payment
          pollCount.current = 0;
        } else {
          // For other payment methods or if payment already completed, proceed to confirmation
          setStep(5);
        }
      } else {
        Alert.alert('Error', response.data.error || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', error.response?.data?.error || 'An error occurred');
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
                    <Text style={styles.doctorPrice}>Ksh{doctor.price}</Text>
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
                  <Text style={styles.summaryValue}>Ksh{selectedDoctor?.price}</Text>
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


              {paymentMethod === 'mpesa' ? (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter M-Pesa Phone Number (e.g., 254XXXXXXXXX)"
                    value={paymentDetails}
                    onChangeText={(text) => {
                      // Remove any non-numeric characters
                      const numericText = text.replace(/[^0-9]/g, '');
                      
                      // Format as needed - ensure it starts with 254
                      let formattedNumber = numericText;
                      if (numericText.startsWith('0')) {
                        formattedNumber = '254' + numericText.substring(1);
                      } else if (!numericText.startsWith('254') && numericText.length > 0) {
                        formattedNumber = '254' + numericText;
                      }
                      
                      setPaymentDetails(formattedNumber);
                    }}
                    keyboardType="phone-pad"
                    placeholderTextColor="#6c757d"
                    maxLength={12} // Adjust based on expected length including the 254 prefix
                  />
                  <Text style={styles.helperText}>
                    Format: 254XXXXXXXXX (9 digits after 254)
                  </Text>
                </View>
              ) : paymentMethod === 'card' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Enter card number"
                  value={paymentDetails}
                  onChangeText={setPaymentDetails}
                  keyboardType="number-pad"
                  placeholderTextColor="#6c757d"
                  secureTextEntry
                />
              ) : paymentMethod === 'paypal' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Enter PayPal email"
                  value={paymentDetails}
                  onChangeText={setPaymentDetails}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#6c757d"
                />
              ) : null}

              {/* M-Pesa payment status section */}
              {paymentMethod === 'mpesa' && appointmentId && paymentStatus === 'pending' && (
                <View style={styles.mpesaStatusContainer}>
                  <Text style={styles.mpesaStatusTitle}>M-Pesa Payment Status</Text>
                  <View style={styles.mpesaStatusIndicator}>
                    <ActivityIndicator color="#007AFF" size="small" />
                    <Text style={styles.mpesaStatusText}>
                      {paymentDescription || 'Waiting for payment confirmation...'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={checkPaymentStatus}
                    disabled={checkingPaymentStatus}
                  >
                    {checkingPaymentStatus ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.refreshButtonText}>Refresh Status</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {!appointmentId ? (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  (!paymentDetails || !email || !patientName || !paymentMethod) && styles.disabledButton
                ]}
                onPress={handlePayment}
                disabled={!paymentDetails || !email || !patientName || !paymentMethod || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextButtonText}>Pay Ksh{selectedDoctor?.price}</Text>
                )}
              </TouchableOpacity>
            ) : paymentStatus === 'pending' ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setStep(5)}
              >
                <Text style={styles.nextButtonText}>Continue to Confirmation</Text>
              </TouchableOpacity>
            ) : null}
            ) : paymentStatus === 'pending' ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setStep(5)}
              >
                <Text style={styles.nextButtonText}>Continue to Confirmation</Text>
              </TouchableOpacity>
            ) : null}
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
              
              <View style={[
                styles.paymentStatusBadge,
                paymentStatus === 'completed' ? styles.paymentCompleted : 
                paymentStatus === 'failed' ? styles.paymentFailed : styles.paymentPending
              ]}>
                <Text style={styles.paymentStatusText}>
                  Payment: {paymentStatus === 'completed' ? 'Completed' : 
                          paymentStatus === 'failed' ? 'Failed' : 'Pending'}
                </Text>
              </View>
              
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
              
              {paymentStatus === 'pending' && paymentMethod === 'mpesa' && (
                <TouchableOpacity
                  style={styles.checkPaymentButton}
                  onPress={checkPaymentStatus}
                  disabled={checkingPaymentStatus}
                >
                  {checkingPaymentStatus ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.checkPaymentButtonText}>Check Payment Status</Text>
                  )}
                </TouchableOpacity>
              )}
              
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
  mpesaStatusContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  mpesaStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  mpesaStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mpesaStatusText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // For the payment status badge in the confirmation screen
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  paymentCompleted: {
    backgroundColor: '#e6f7ee',
  },
  paymentPending: {
    backgroundColor: '#fff9e6',
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  paymentDescription: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 16,
  },
  
  paymentFailed: {
    backgroundColor: '#ffdddd',
    borderColor: '#ff6666',
  },
  // For the check payment button in the confirmation screen
  checkPaymentButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkPaymentButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TelemedicineAppointment;