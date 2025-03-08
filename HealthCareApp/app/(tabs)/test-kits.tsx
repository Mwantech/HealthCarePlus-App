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
  variant = 'primary' 
}: { 
  onPress: () => void; 
  title: string; 
  variant?: 'primary' | 'secondary';
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.button,
      variant === 'secondary' && styles.buttonSecondary
    ]}
  >
    <Text style={[
      styles.buttonText,
      variant === 'secondary' && styles.buttonTextSecondary
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
              <Text style={styles.kitPrice}>${kit.price}</Text>
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
          <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
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
}) => (
  <View style={styles.stepContainer}>
    <ScrollView style={styles.scrollView}>
      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Delivery Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full address"
            value={shippingInfo.address}
            onChangeText={(text) =>
              setShippingInfo({ ...shippingInfo, address: text })
            }
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={shippingInfo.phone}
            onChangeText={(text) =>
              setShippingInfo({ ...shippingInfo, phone: text })
            }
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={shippingInfo.email}
            onChangeText={(text) =>
              setShippingInfo({ ...shippingInfo, email: text })
            }
          />
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
        onPress={nextStep} 
      />
    </View>
  </View>
);

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
  ) => void;
}) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    mpesaNumber: '',
    paypalEmail: '',
  });

  const generateOrderNumber = () => {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const handleSubmit = () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }
    const orderNumber = generateOrderNumber();
    completeOrder(paymentMethod, paymentDetails, orderNumber);
    nextStep();
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
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
                value={paymentDetails.cardNumber}
                onChangeText={(text) =>
                  setPaymentDetails({ ...paymentDetails, cardNumber: text })
                }
              />
            </View>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  value={paymentDetails.expiry}
                  onChangeText={(text) =>
                    setPaymentDetails({ ...paymentDetails, expiry: text })
                  }
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={3}
                  value={paymentDetails.cvv}
                  onChangeText={(text) =>
                    setPaymentDetails({ ...paymentDetails, cvv: text })
                  }
                />
              </View>
            </View>
          </View>
        )}

        {paymentMethod === 'PayPal' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PayPal Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={paymentDetails.paypalEmail}
                onChangeText={(text) =>
                  setPaymentDetails({ ...paymentDetails, paypalEmail: text })
                }
              />
            </View>
          </View>
        )}

        {paymentMethod === 'Mpesa' && (
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mpesa Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Mpesa number"
                keyboardType="phone-pad"
                value={paymentDetails.mpesaNumber}
                onChangeText={(text) =>
                  setPaymentDetails({ ...paymentDetails, mpesaNumber: text })
                }
              />
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <CustomButton 
          title="Back" 
          onPress={prevStep} 
          variant="secondary" 
        />
        <CustomButton 
          title="Complete Order" 
          onPress={handleSubmit} 
        />
      </View>
    </View>
  );
};

const OrderConfirmation = ({ orderDetails }: { orderDetails: OrderDetails }) => (
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
      </View>
    </View>
  </View>
);

// Main Component
const TestKitOrderSystem = () => {
  const [step, setStep] = useState(1);
  const [kits, setKits] = useState<TestKit[]>([]);
  const [selectedKits, setSelectedKits] = useState<SelectedKit[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '',
    phone: '',
    email: '',
  });
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    orderNumber: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestKits();
  }, []);

  const fetchTestKits = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/testkits`);
      setKits(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch test kits');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const completeOrder = async (
    paymentMethod: string,
    paymentDetails: PaymentDetails,
    orderNumber: string
  ) => {
    try {
      const response = await axios.post(`${BASE_URL}/orders`, {
        selectedKits,
        shippingInfo,
        paymentMethod,
        paymentDetails,
        orderNumber,
      });
      setOrderDetails(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to place order');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <TestKitSelection
            kits={kits}
            selectedKits={selectedKits}
            setSelectedKits={setSelectedKits}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <ReviewAndConfirm
            selectedKits={selectedKits}
            prevStep={prevStep}
            nextStep={nextStep}
          />
        );
      case 3:
        return (
          <ShippingInformation
            shippingInfo={shippingInfo}
            setShippingInfo={setShippingInfo}
            prevStep={prevStep}
            nextStep={nextStep}
          />
        );
      case 4:
        return (
          <PaymentOptions
            prevStep={prevStep}
            nextStep={nextStep}
            completeOrder={completeOrder}
          />
        );
      case 5:
        return <OrderConfirmation orderDetails={orderDetails} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <ModernHeader 
        step={step} 
        totalSteps={5} 
        title="Medical Test Kits" 
      />
      {renderStep()}
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
});

export default TestKitOrderSystem;