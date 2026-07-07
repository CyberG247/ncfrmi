class Intervention {
  final String id;
  final String camp;
  final String category;
  final String details;
  final int count;
  final String? capturedBy;
  final String createdAt;

  Intervention({
    required this.id,
    required this.camp,
    required this.category,
    required this.details,
    required this.count,
    this.capturedBy,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'camp': camp,
    'category': category,
    'details': details,
    'count': count,
    'captured_by': capturedBy,
    'created_at': createdAt,
  };

  factory Intervention.fromJson(Map<String, dynamic> json) => Intervention(
    id: json['id'],
    camp: json['camp'],
    category: json['category'],
    details: json['details'],
    count: json['count'],
    capturedBy: json['captured_by'],
    createdAt: json['created_at'],
  );
}
