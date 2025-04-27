import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../api/api';
import { OrderStorageService } from '../services/OrderStorageService';

// Types
interface TestKit {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface SelectedKit extends TestKit {
  quantity: number;
}

interface ShippingInfo {
  address: string;
  phone: string;
  email: string;
}

interface PaymentDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
  mpesaNumber: string;
  paypalEmail: string;
}

interface OrderDetails {
  orderNumber: string;
  paymentMethod: string;
  status: string;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  totalAmount: number;
}

interface StepIndicator {
  title: string;
  isCompleted: boolean;
  isActive: boolean;
}

// Modern Header Component
const ModernHeader = ({ 
  step, 
  totalSteps,
  title 
}: { 
  step: number;
  totalSteps: number;
  title: string;
}) => {
  const steps: StepIndicator[] = [
    { title: "Select", isCompleted: step > 1, isActive: step === 1 },
    { title: "Review", isCompleted: step > 2, isActive: step === 2 },
    { title: "Shipping", isCompleted: step > 3, isActive: step === 3 },
    { title: "Payment", isCompleted: step > 4, isActive: step === 4 },
    { title: "Status", isCompleted: step > 5, isActive: step === 5 },
  ];

  return (
    <View style={styles.headerContainer}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(step / totalSteps) * 100}%` }
              ]} 
            />
          </View>
          <View style={styles.stepsContainer}>
            {steps.map((stepItem, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  stepItem.isCompleted && styles.stepCompleted,
                  stepItem.isActive && styles.stepActive
                ]}>
                  {stepItem.isCompleted && (
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  )}
                </View>
                <Text style={[
                  styles.stepText,
                  stepItem.isActive && styles.stepTextActive
                ]}>
                  {stepItem.title}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

// Reusable Components
const CustomButton = ({ 
  onPress, 
  title, 
  variant = 'primary',
  disabled = false
}: { 
  onPress: () => void; 
  title: string; 
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.button,
      variant === 'secondary' && styles.buttonSecondary,
      disabled && styles.buttonDisabled
    ]}
  >
    <Text style={[
      styles.buttonText,
      variant === 'secondary' && styles.buttonTextSecondary,
      disabled && styles.buttonTextDisabled
    ]}>
      {title}
    </Text>
  </TouchableOpacity>
);

// Step Components
const TestKitSelection = ({ 
  kits, 
  selectedKits, 
  setSelectedKits, 
  nextStep 
}: { 
  kits: TestKit[];
  selectedKits: SelectedKit[];
  setSelectedKits: (kits: SelectedKit[]) => void;
  nextStep: () => void;
}) => {
  const handleSelectKit = (kit: TestKit) => {
    const existingKit = selectedKits.find((k) => k.id === kit.id);
    if (existingKit) {
      setSelectedKits(
        selectedKits.map((k) =>
          k.id === kit.id ? { ...k, quantity: k.quantity + 1 } : k
        )
      );
    } else {
      setSelectedKits([...selectedKits, { ...kit, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (kitId: string, quantity: string) => {
    const numQuantity = parseInt(quantity) || 1;
    setSelectedKits(
      selectedKits.map((k) =>
        k.id === kitId ? { ...k, quantity: numQuantity } : k
      )
    );
  };

  return (
    <ScrollView style={styles.stepContainer}>
      {kits.map((kit) => (
        <View key={kit.id} style={styles.kitCard}>
          <TouchableOpacity
            style={styles.kitItemContent}
            onPress={() => handleSelectKit(kit)}
          >
            <View style={styles.kitImagePlaceholder}>
              <Ionicons name="medical" size={24} color="#2C3E50" />
            </View>
            <View style={styles.kitInfo}>
              <Text style={styles.kitName}>{kit.name}</Text>
              <Text style={styles.kitPrice}>Ksh{kit.price}</Text>
              {kit.description && (
                <Text style={styles.kitDescription} numberOfLines={2}>
                  {kit.description}
                </Text>
              )}
            </View>
            {selectedKits.some((k) => k.id === kit.id) && (
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(
                    kit.id, 
                    String(Math.max(1, (selectedKits.find(k => k.id === kit.id)?.quantity || 1) - 1))
                  )}
                >
                  <Ionicons name="remove" size={20} color="#2C3E50" />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={String(
                    selectedKits.find((k) => k.id === kit.id)?.quantity || 1
                  )}
                  onChangeText={(value) => handleQuantityChange(kit.id, value)}
                />
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(
                    kit.id, 
                    String((selectedKits.find(k => k.id === kit.id)?.quantity || 0) + 1)
                  )}
                >
                  <Ionicons name="add" size={20} color="#2C3E50" />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ))}
      
      <View style={styles.buttonContainer}>
        <CustomButton 
          title="Review Order" 
          onPress={nextStep}
          disabled={selectedKits.length === 0}
        />
      </View>
    </ScrollView>
  );
};

const ReviewAndConfirm = ({
  selectedKits,
  prevStep,
  nextStep,
}: {
  selectedKits: SelectedKit[];
  prevStep: () => void;
  nextStep: () => void;
}) => {
  const totalAmount = selectedKits.reduce(
    (sum, kit) => sum + kit.price * kit.quantity,
    0
  );

  return (
    <View style={styles.stepContainer}>
      <ScrollView style={styles.scrollView}>
        {selectedKits.map((kit) => (
          <View key={kit.id} style={styles.reviewCard}>
            <View style={styles.reviewItemHeader}>
              <Text style={styles.reviewItemName}>{kit.name}</Text>
              <Text style={styles.reviewItemQuantity}>x{kit.quantity}</Text>
            </View>
            <Text style={styles.reviewItemPrice}>
              ${(kit.price * kit.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>Ksh{totalAmount.toFixed(2)}</Text>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <CustomButton 
          title="Back" 
          onPress={prevStep} 
          variant="secondary" 
        />
        <CustomButton 
          title="Continue to Shipping" 
          onPress={nextStep} 
        />
      </View>
    </View>
  );
};

const ShippingInformation = ({
  shippingInfo,
  setShippingInfo,
  prevStep,
  nextStep,
}: {
  shippingInfo: ShippingInfo;
  setShippingInfo: (info: ShippingInfo) => void;
  prevStep: () => void;
  nextStep: () => void;
}) => {
  const [formErrors, setFormErrors] = useState({
    address: '',
    phone: '',
    email: ''
  });

  const validateForm = () => {
    let isValid = true;
    const errors = {
      address: '',
      phone: '',
      email: ''
    };

    if (!shippingInfo.address.trim()) {
      errors.address = 'Address is required';
      isValid = false;
    }

    if (!shippingInfo.phone.trim()) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10,15}$/.test(shippingInfo.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    if (!shippingInfo.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleNext = () => {
    if (validateForm()) {
      nextStep();
    }
  };

  return (
    <View style={styles.stepContainer}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Address</Text>
            <TextInput
              style={[styles.input, formErrors.address ? styles.inputError : null]}
              placeholder="Enter your full address"
              value={shippingInfo.address}
              onChangeText={(text) =>
                setShippingInfo({ ...shippingInfo, address: text })
              }
              multiline
            />
            {formErrors.address ? <Text style={styles.errorText}>{formErrors.address}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.input, formErrors.phone ? styles.inputError : null]}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={shippingInfo.phone}
              onChangeText={(text) =>
                setShippingInfo({ ...shippingInfo, phone: text })
              }
            />
            {formErrors.phone ? <Text style={styles.errorText}>{formErrors.phone}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[styles.input, formErrors.email ? styles.inputError : null]}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={shippingInfo.email}
              onChangeText={(text) =>
                setShippingInfo({ ...shippingInfo, email: text })
              }
            />
            {formErrors.email ? <Text style={styles.errorText}>{formErrors.email}</Text> : null}
          </View>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <CustomButton 
          title="Back" 
          onPress={prevStep} 
          variant="secondary" 
        />
        <CustomButton 
          title="Continue to Payment" 
          onPress={handleNext} 
        />
      </View>
    </View>
  );
};

const PaymentOptions = ({
  prevStep,
  nextStep,
  completeOrder,
}: {
  prevStep: () => void;
  nextStep: () => void;
  completeOrder: (
    paymentMethod: string,
    paymentDetails: PaymentDetails,
    orderNumber: string
  ) => Promise<OrderDetails | null>;
}) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    mpesaNumber: '',
    paypalEmail: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    mpesaNumber: '',
    paypalEmail: '',
  });

  const generateOrderNumber = () => {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      cardNumber: '',
      expiry: '',
      cvv: '',
      mpesaNumber: '',
      paypalEmail: '',
    };

    if (paymentMethod === 'Credit Card') {
      if (!paymentDetails.cardNumber.trim()) {
        errors.cardNumber = 'Card number is required';
        isValid = false;
      } else if (!/^\d{16}$/.test(paymentDetails.cardNumber.replace(/\s/g, ''))) {
        errors.cardNumber = 'Please enter a valid 16-digit card number';
        isValid = false;
      }

      if (!paymentDetails.expiry.trim()) {
        errors.expiry = 'Expiry date is required';
        isValid = false;
      } else if (!/^\d{2}\/\d{2}$/.test(paymentDetails.expiry)) {
        errors.expiry = 'Use format MM/YY';
        isValid = false;
      }

      if (!paymentDetails.cvv.trim()) {
        errors.cvv = 'CVV is required';
        isValid = false;
      } else if (!/^\d{3,4}$/.test(paymentDetails.cvv)) {
        errors.cvv = 'Invalid CVV';
        isValid = false;
      }
    } else if (paymentMethod === 'PayPal') {
      if (!paymentDetails.paypalEmail.trim()) {
        errors.paypalEmail = 'PayPal email is required';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(paymentDetails.paypalEmail)) {
        errors.paypalEmail = 'Please enter a valid email address';
        isValid = false;
      }
    } else if (paymentMethod === 'Mpesa') {
      if (!paymentDetails.mpesaNumber.trim()) {
        errors.mpesaNumber = 'M-Pesa number is required';
        isValid = false;
      } else if (!/^\d{10,12}$/.test(paymentDetails.mpesaNumber.replace(/\D/g, ''))) {
        errors.mpesaNumber = 'Please enter a valid M-Pesa number';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    const orderNumber = generateOrderNumber();
    
    try {
      const result = await completeOrder(paymentMethod, paymentDetails, orderNumber);
      if (result) {
        nextStep();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Payment Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format M-Pesa number to ensure it's in the correct format
  const formatMpesaNumber = (number: string) => {
    // Remove non-digit characters
    let digits = number.replace(/\D/g, '');
    
    // Handle Kenyan phone numbers - ensure it starts with 254
    if (digits.startsWith('0') && digits.length >= 10) {
      digits = '254' + digits.substring(1);
    } else if (!digits.startsWith('254') && digits.length >= 9) {
      digits = '254' + digits;
    }
    
    return digits;
  };

  return (
    <View style={styles.stepContainer}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.paymentMethodsContainer}>
          {['Credit Card', 'PayPal', 'Mpesa'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentMethodCard,
                paymentMethod === method && styles.paymentMethodSelected,
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <Ionicons 
                name={
                  method === 'Credit Card' ? 'card' :
                  method === 'PayPal' ? 'logo-paypal' : 'phone-portrait'
                } 
                size={24} 
                color={paymentMethod === method ? '#3498DB' : '#2C3E50'} 
              />
              <Text style={[
                styles.paymentMethodText,
                paymentMethod === method && styles.paymentMethodTextSelected
              ]}>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {paymentMethod === 'Credit Card' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={[styles.input, formErrors.cardNumber ? styles.inputError : null]}
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
                value={paymentDetails.cardNumber}
                onChangeText={(text) =>
                  setPaymentDetails({ ...paymentDetails, cardNumber: text })
                }
              />
              {formErrors.cardNumber ? <Text style={styles.errorText}>{formErrors.cardNumber}</Text> : null}
            </View>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={[styles.input, formErrors.expiry ? styles.inputError : null]}
                  placeholder="MM/YY"
                  value={paymentDetails.expiry}
                  onChangeText={(text) =>
                    setPaymentDetails({ ...paymentDetails, expiry: text })
                  }
                />
                {formErrors.expiry ? <Text style={styles.errorText}>{formErrors.expiry}</Text> : null}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={[styles.input, formErrors.cvv ? styles.inputError : null]}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={3}
                  value={paymentDetails.cvv}
                  onChangeText={(text) =>
                    setPaymentDetails({ ...paymentDetails, cvv: text })
                  }
                />
                {formErrors.cvv ? <Text style={styles.errorText}>{formErrors.cvv}</Text> : null}
              </View>
            </View>
          </View>
        )}

        {paymentMethod === 'PayPal' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PayPal Email</Text>
              <TextInput
                style={[styles.input, formErrors.paypalEmail ? styles.inputError : null]}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={paymentDetails.paypalEmail}
                onChangeText={(text) =>
                  setPaymentDetails({ ...paymentDetails, paypalEmail: text })
                }
              />
              {formErrors.paypalEmail ? <Text style={styles.errorText}>{formErrors.paypalEmail}</Text> : null}
            </View>
          </View>
        )}

        {paymentMethod === 'Mpesa' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>M-Pesa Number</Text>
              <TextInput
                style={[styles.input, formErrors.mpesaNumber ? styles.inputError : null]}
                placeholder="Enter M-Pesa number (e.g. 254712345678)"
                keyboardType="phone-pad"
                value={paymentDetails.mpesaNumber}
                onChangeText={(text) => {
                  const formattedNumber = formatMpesaNumber(text);
                  setPaymentDetails({ ...paymentDetails, mpesaNumber: formattedNumber });
                }}
              />
              {formErrors.mpesaNumber ? (
                <Text style={styles.errorText}>{formErrors.mpesaNumber}</Text>
              ) : (
                <Text style={styles.helperText}>
                  Enter your M-Pesa registered phone number starting with 254
                </Text>
              )}
            </View>
            
            <View style={styles.mpesaInfoCard}>
              <Ionicons name="information-circle" size={20} color="#3498DB" />
              <Text style={styles.mpesaInfoText}>
                You will receive an M-Pesa STK Push prompt on your phone to complete the payment.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <CustomButton 
          title="Back" 
          onPress={prevStep} 
          variant="secondary" 
          disabled={isProcessing}
        />
        <CustomButton 
          title={isProcessing ? "Processing..." : "Complete Order"}
          onPress={handleSubmit} 
          disabled={isProcessing || !paymentMethod}
        />
      </View>
    </View>
  );
};

// This component replaces the modal with an integrated page in the flow
const PaymentStatusScreen = ({
  orderDetails,
  prevStep,
  nextStep,
  checkPaymentStatus,
}: {
  orderDetails: OrderDetails;
  prevStep: () => void;
  nextStep: () => void;
  checkPaymentStatus: () => Promise<void>;
}) => {
  const [paymentStatus, setPaymentStatus] = useState(orderDetails.status);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusCheckCount, setStatusCheckCount] = useState(0);
  const [timer, setTimer] = useState(60);
  const [statusDescription, setStatusDescription] = useState('');
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let statusCheckInterval: NodeJS.Timeout;

    // If payment is pending, start checking status every 5 seconds
    if (paymentStatus === 'pending') {
      // Check status immediately on first load
      handleCheckStatus();
      
      // Set up interval for status checks (every 5 seconds)
      statusCheckInterval = setInterval(() => {
        if (statusCheckCount < 12) { // Maximum 12 checks (1 minute)
          handleCheckStatus();
          setStatusCheckCount(prevCount => prevCount + 1);
        } else {
          clearInterval(statusCheckInterval);
        }
      }, 5000);
      
      // Set up countdown timer
      interval = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      clearInterval(statusCheckInterval);
    };
  }, [paymentStatus, statusCheckCount]);

  const handleCheckStatus = async () => {
    if (isCheckingStatus) return;
    
    setIsCheckingStatus(true);
    try {
      await checkPaymentStatus();
      // Status update is handled by the parent component
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getStatusMessage = () => {
    if (paymentStatus === 'pending') {
      return statusDescription || 
        "Please check your phone for the M-Pesa STK push prompt and enter your PIN to complete the payment.";
    } else if (paymentStatus === 'completed') {
      return statusDescription || 
        "Your payment was successfully processed. Thank you for your order!";
    } else if (paymentStatus === 'failed') {
      return statusDescription || 
        "Your payment could not be processed. Please try again or choose a different payment method.";
    }
    return "";
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.paymentStatusCard}>
        <View style={styles.paymentStatusHeader}>
          <Ionicons 
            name={
              paymentStatus === 'completed' ? 'checkmark-circle' : 
              paymentStatus === 'failed' ? 'close-circle' : 'time'
            } 
            size={50} 
            color={
              paymentStatus === 'completed' ? '#2ECC71' : 
              paymentStatus === 'failed' ? '#E74C3C' : '#3498DB'
            } 
          />
          <Text style={styles.paymentStatusTitle}>
            {paymentStatus === 'completed' ? 'Payment Successful' : 
             paymentStatus === 'failed' ? 'Payment Failed' : 'Payment Processing'}
          </Text>
        </View>
        
        <View style={styles.paymentStatusContent}>
          <Text style={styles.orderNumber}>
            Order #{orderDetails.orderNumber}
          </Text>
          
          <Text style={styles.paymentStatusMessage}>
            {getStatusMessage()}
          </Text>
          
          {paymentStatus === 'pending' && (
            <View style={styles.paymentTimer}>
              <Text style={styles.paymentTimerText}>
                Auto-refreshing in {timer} seconds
              </Text>
              <ActivityIndicator 
                size="small" 
                color="#3498DB" 
                style={styles.paymentTimerSpinner} 
              />
            </View>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          {paymentStatus === 'pending' && (
            <>
              <CustomButton 
                title="Back to Payment" 
                onPress={prevStep}
                variant="secondary"
                disabled={isCheckingStatus}
              />
              <CustomButton 
                title="Check Status" 
                onPress={handleCheckStatus}
                disabled={isCheckingStatus}
              />
            </>
          )}
          
          {paymentStatus === 'completed' && (
            <CustomButton 
              title="Continue" 
              onPress={nextStep}
            />
          )}
          
          {paymentStatus === 'failed' && (
            <>
              <CustomButton 
                title="Try Again" 
                onPress={prevStep}
                variant="secondary"
              />
              <TouchableOpacity 
                style={styles.manualVerificationLink}
              >
                <Text style={styles.manualVerificationText}>
                  Verify with M-Pesa code
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};


const OrderConfirmation = ({ 
  orderDetails, 
  navigationToOrderHistory 
}: { 
  orderDetails: OrderDetails,
  navigationToOrderHistory?: () => void 
}) => (
  <View style={styles.stepContainer}>
    <View style={styles.confirmationCard}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color="#2ECC71" />
      </View>
      <Text style={styles.confirmationTitle}>Thank you for your order!</Text>
      <Text style={styles.confirmationOrderNumber}>
        Order #{orderDetails.orderNumber}
      </Text>
      <View style={styles.confirmationDetails}>
        <Text style={styles.confirmationText}>
          We'll send you a confirmation email with your order details shortly.
        </Text>
        <Text style={styles.confirmationDelivery}>
          Estimated Delivery: 3-5 business days
        </Text>
        {orderDetails.paymentMethod === 'Mpesa' && (
          <View style={styles.paymentStatusInfo}>
            <Ionicons 
              name={orderDetails.status === 'completed' ? 'checkmark-circle' : 'time'} 
              size={18} 
              color={orderDetails.status === 'completed' ? '#2ECC71' : '#F39C12'} 
            />
            <Text style={styles.paymentStatusText}>
              {orderDetails.status === 'completed' 
                ? 'Payment completed' 
                : 'Payment processing'
              }
            </Text>
          </View>
        )}
      </View>
      
      {navigationToOrderHistory && (
        <CustomButton 
          title="View Order History" 
          onPress={navigationToOrderHistory} 
        />
      )}
    </View>
  </View>
);

// Main CheckoutScreen Component
export const CheckoutScreen = ({ navigation }: { navigation: any }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [testKits, setTestKits] = useState<TestKit[]>([]);
  const [selectedKits, setSelectedKits] = useState<SelectedKit[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    phone: '',
    email: '',
  });
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [showMpesaStatusModal, setShowMpesaStatusModal] = useState(false);

  useEffect(() => {
    fetchTestKits();
  }, []);

  const fetchTestKits = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/testkits`);
      // Directly set the entire response.data to testKits without checking for success
      setTestKits(response.data);
    } catch (error) {
      console.error('Error fetching test kits:', error);
      Alert.alert('Error', 'Failed to fetch test kits');
    } finally {
      setIsLoading(false);
    }
  };

  const completeOrder = async (
    paymentMethod: string,
    paymentDetails: PaymentDetails,
    orderNumber: string
  ): Promise<OrderDetails | null> => {
    try {
      const totalAmount = selectedKits.reduce(
        (sum, kit) => sum + kit.price * kit.quantity,
        0
      );

      // For M-Pesa, we need to initiate the STK push
      if (paymentMethod === 'Mpesa') {
        const response = await axios.post(`${BASE_URL}/orders`, {
          selectedKits: selectedKits,
          shippingInfo: shippingInfo,
          paymentMethod: paymentMethod,
          paymentDetails: paymentDetails,
          orderNumber: orderNumber,
        });

        if (response.data.success) {
          const newOrderDetails: OrderDetails = {
            orderNumber: orderNumber,
            paymentMethod: paymentMethod,
            status: 'pending',
            checkoutRequestID: response.data.CheckoutRequestID,
            merchantRequestID: response.data.MerchantRequestID,
            totalAmount: totalAmount,
          };

          // Store order in local storage
          await OrderStorageService.saveOrder({
            orderNumber: newOrderDetails.orderNumber,
            items: selectedKits,
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            status: 'pending',
            orderDate: new Date().toISOString(),
            shippingInfo: shippingInfo,
          });

          setOrderDetails(newOrderDetails);
          setShowMpesaStatusModal(true);
          return newOrderDetails;
        } else {
          throw new Error('Failed to initiate M-Pesa payment');
        }
      } else {
        // For credit card and PayPal, simulate a payment process
        // In a real app, you would integrate with a payment gateway
        const mockPaymentResponse = await new Promise<boolean>((resolve) => {
          setTimeout(() => {
            resolve(true); // Simulate successful payment
          }, 2000);
        });

        if (mockPaymentResponse) {
          const newOrderDetails: OrderDetails = {
            orderNumber: orderNumber,
            paymentMethod: paymentMethod,
            status: 'completed',
            totalAmount: totalAmount,
          };

          // Store order in local storage
          await OrderStorageService.saveOrder({
            orderNumber: newOrderDetails.orderNumber,
            items: selectedKits,
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            status: 'completed',
            orderDate: new Date().toISOString(),
            shippingInfo: shippingInfo,
          });

          setOrderDetails(newOrderDetails);
          return newOrderDetails;
        } else {
          throw new Error('Payment processing failed');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Error',
        'There was an error processing your payment. Please try again.'
      );
      return null;
    }
  };

  const handleCloseModal = () => {
    setShowMpesaStatusModal(false);
    setCurrentStep(5); // Move to confirmation step
  };

  const handleRetryPayment = () => {
    setShowMpesaStatusModal(false);
    setCurrentStep(4); // Go back to payment step
  };

  const navigateToOrderHistory = () => {
    if (navigation) {
      navigation.navigate('OrderHistory');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Select Test Kits';
      case 2:
        return 'Review Order';
      case 3:
        return 'Shipping Details';
      case 4:
        return 'Payment Method';
      case 5:
        return 'Order Confirmation';
      default:
        return 'Checkout';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <TestKitSelection
            kits={testKits}
            selectedKits={selectedKits}
            setSelectedKits={setSelectedKits}
            nextStep={() => setCurrentStep(2)}
          />
        );
      case 2:
        return (
          <ReviewAndConfirm
            selectedKits={selectedKits}
            prevStep={() => setCurrentStep(1)}
            nextStep={() => setCurrentStep(3)}
          />
        );
      case 3:
        return (
          <ShippingInformation
            shippingInfo={shippingInfo}
            setShippingInfo={setShippingInfo}
            prevStep={() => setCurrentStep(2)}
            nextStep={() => setCurrentStep(4)}
          />
        );
      case 4:
        return (
          <PaymentOptions
            prevStep={() => setCurrentStep(3)}
            nextStep={() => {
              if (!showMpesaStatusModal) {
                setCurrentStep(5);
              }
            }}
            completeOrder={completeOrder}
          />
        );
      case 5:
        return orderDetails ? (
          <OrderConfirmation 
            orderDetails={orderDetails} 
            navigationToOrderHistory={navigateToOrderHistory}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498DB" />
            <Text style={styles.loadingText}>Processing your order...</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ModernHeader 
        step={currentStep} 
        totalSteps={5} 
        title={getStepTitle()} 
      />

      {isLoading && currentStep === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
          <Text style={styles.loadingText}>Loading test kits...</Text>
        </View>
      ) : (
        renderStep()
      )}

      
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9', // Light white background
  },
  headerContainer: {
    backgroundColor: '#000000', // Black header
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeHeader: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF', // White text
  },
  cartButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', // Translucent white
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF69B4', // Pink progress fill
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    width: 80,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', // Translucent white
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepActive: {
    backgroundColor: '#FF69B4', // Pink active step
  },
  stepCompleted: {
    backgroundColor: '#FFB6C1', // Light pink completed step
  },
  stepText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)', // Translucent white text
    textAlign: 'center',
  },
  stepTextActive: {
    color: '#FFFFFF', // White text for active step
    fontWeight: '600',
  },
  stepContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9', // Light white background
  },
  
  scrollView: {
    flex: 1,
    backgroundColor: '#F9F9F9', // Light white background
    paddingBottom: 80,
  },
  kitCard: {
    backgroundColor: '#FFFFFF', // White card
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kitImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5', // Very light gray/white
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kitItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kitInfo: {
    flex: 1,
  },
  kitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000', // Black text
    marginBottom: 4,
  },
  kitPrice: {
    fontSize: 14,
    color: '#FF69B4', // Pink price
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5', // Very light gray/white
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF', // White background
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0', // Very light gray border
    marginTop: 16,
    marginBottom: 80,
  },
  button: {
    height: 48,
    backgroundColor: '#FF69B4', // Pink button
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF', // White background
    borderWidth: 1,
    borderColor: '#FF69B4', // Pink border
  },
  buttonText: {
    color: '#FFFFFF', // White text
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#FF69B4', // Pink text
  },
  reviewCard: {
    backgroundColor: '#FFFFFF', // White card
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000', // Black text
  },
  reviewItemQuantity: {
    fontSize: 14,
    color: '#777777', // Dark gray text
  },
  reviewItemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF69B4', // Pink price
  },
  totalContainer: {
    backgroundColor: '#FFFFFF', // White container
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 14,
    color: '#777777', // Dark gray text
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000', // Black text
  },
  formCard: {
    backgroundColor: '#FFFFFF', // White card
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#777777', // Dark gray text
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#F0F0F0', // Very light gray border
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000', // Black text
    backgroundColor: '#FFFFFF', // White background
  },
  rowInputs: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  paymentMethodsContainer: {
    padding: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White card
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0', // Very light gray border
  },
  paymentMethodSelected: {
    borderColor: '#FF69B4', // Pink border for selected
    backgroundColor: '#FFF0F5', // Very light pink background
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000', // Black text
    marginLeft: 12,
  },
  paymentMethodTextSelected: {
    color: '#FF69B4', // Pink text for selected
  },
  confirmationCard: {
    backgroundColor: '#FFFFFF', // White card
    borderRadius: 12,
    margin: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000', // Black text
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationOrderNumber: {
    fontSize: 16,
    color: '#777777', // Dark gray text
    marginBottom: 24,
  },
  confirmationDetails: {
    width: '100%',
    padding: 16,
    backgroundColor: '#FFF0F5', // Very light pink background
    borderRadius: 8,
  },
  confirmationText: {
    fontSize: 14,
    color: '#000000', // Black text
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmationDelivery: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF69B4', // Pink text
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9', // Light white background
  },
  // Container style referenced in main component
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  
  // Button disabled styles
  buttonDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  
  buttonTextDisabled: {
    color: '#AAAAAA',
  },
  
  // Input error styles
  inputError: {
    borderColor: '#E74C3C',
    borderWidth: 1,
  },
  
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 4,
  },
  
  helperText: {
    color: '#777777',
    fontSize: 12,
    marginTop: 4,
  },
  
  // Kit description
  kitDescription: {
    fontSize: 12,
    color: '#777777',
    marginTop: 4,
  },
  
  // M-Pesa specific styles
  mpesaInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FC',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  
  mpesaInfoText: {
    marginLeft: 8,
    color: '#2C3E50',
    fontSize: 13,
    flex: 1,
  },
  
  // M-Pesa Status Modal
  mpesaStatusContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  
  mpesaStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  
  mpesaStatusHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  mpesaStatusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginTop: 12,
  },
  
  mpesaStatusContent: {
    marginBottom: 24,
  },
  
  mpesaOrderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  
  mpesaStatusMessage: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
    marginBottom: 16,
  },
  
  mpesaTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FC',
    padding: 12,
    borderRadius: 8,
  },
  
  mpesaTimerText: {
    fontSize: 14,
    color: '#3498DB',
    marginRight: 8,
  },
  
  mpesaTimerSpinner: {
    marginLeft: 8,
  },
  
  mpesaStatusActions: {
    marginTop: 8,
  },
  
  // Payment status display
  paymentStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  
  paymentStatusText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
    color: '#2C3E50',
  },
  
  // Loading text
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#777777',
  },
});


export default CheckoutScreen;