import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('hostel_ratings')
export class HostelRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', width: 1 })
  accommodation_rooms: number;

  @Column({ type: 'int', width: 1 })
  maintenance_facilities: number;

  @Column({ type: 'int', width: 1 })
  medical_facilities: number;

  @Column({ type: 'int', width: 1 })
  mess_food_quality: number;

  @Column({ type: 'int', width: 1 })
  safety_security: number;

  @Column({ type: 'int', width: 1 })
  wifi_connectivity: number;

  @Column({ type: 'int', width: 1 })
  washrooms_hygiene: number;

  @Column({ type: 'int', width: 1 })
  discipline_rules: number;

  @Column({ type: 'int', width: 1 })
  hostel_staff_behaviour: number;

  @Column({ type: 'int', width: 1 })
  overall_living_experience: number;

  @Column({ type: 'text', nullable: true })
  feedback_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Profile, (profile) => profile.hostelRatings)
  @JoinColumn({ name: 'student_id' })
  student: Profile;
}
