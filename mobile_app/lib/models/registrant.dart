class Registrant {
  final String id;
  final String reference;
  final String category; // 'idp' | 'refugee' | 'migrant' | 'returnee'
  final String fullName;
  final String address;
  final String phone;
  final String dob;
  final String gender;
  final String nationality;
  final String stateOrigin;
  final String lga;
  final int dependants;
  final String circumstances;
  final bool faceCaptured;
  final bool thumbCaptured;
  final String? capturedBy;
  final String createdAt;

  Registrant({
    required this.id,
    required this.reference,
    required this.category,
    required this.fullName,
    required this.address,
    required this.phone,
    required this.dob,
    required this.gender,
    required this.nationality,
    required this.stateOrigin,
    required this.lga,
    required this.dependants,
    required this.circumstances,
    required this.faceCaptured,
    required this.thumbCaptured,
    this.capturedBy,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'reference': reference,
    'category': category,
    'full_name': fullName,
    'address': address,
    'phone': phone,
    'dob': dob,
    'gender': gender,
    'nationality': nationality,
    'state_origin': stateOrigin,
    'lga': lga,
    'dependants': dependants,
    'circumstances': circumstances,
    'face_captured': faceCaptured,
    'thumb_captured': thumbCaptured,
    'captured_by': capturedBy,
    'created_at': createdAt,
    'photo_base64': photoBase64,
  };

  factory Registrant.fromJson(Map<String, dynamic> json) => Registrant(
    id: json['id'],
    reference: json['reference'],
    category: json['category'],
    fullName: json['full_name'],
    address: json['address'],
    phone: json['phone'],
    dob: json['dob'],
    gender: json['gender'],
    nationality: json['nationality'],
    stateOrigin: json['state_origin'],
    lga: json['lga'],
    dependants: json['dependants'],
    circumstances: json['circumstances'],
    faceCaptured: json['face_captured'],
    thumbCaptured: json['thumb_captured'],
    capturedBy: json['captured_by'],
    createdAt: json['created_at'],
  );

  String? get photoBase64 {
    if (circumstances.contains('===PHOTO_BASE64===')) {
      final parts = circumstances.split('===PHOTO_BASE64===\n');
      if (parts.length > 1) {
        return parts[1].trim();
      }
    }
    return null;
  }

  String get cleanCircumstances {
    if (circumstances.contains('===PHOTO_BASE64===')) {
      return circumstances.split('===PHOTO_BASE64===').first.trim();
    }
    return circumstances;
  }
}
