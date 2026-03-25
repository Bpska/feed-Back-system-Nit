import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Rating } from './rating.entity';
import { HostelRating } from './hostel-rating.entity';
import { Message } from './message.entity';

@Entity('profiles')
export class Profile {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  full_name: string;

  @Column({ unique: true })
  registration_number: string;

  @Column()
  email: string;

  @Column()
  branch: string;

  @Column({ type: 'int', width: 1 })
  year: number;

  @Column({ type: 'int', width: 1 })
  semester: number;

  @Column({ length: 1 })
  section: string;

  @Column({ nullable: true })
  phone_number: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'id' })
  user: User;

  @OneToMany(() => Rating, (rating) => rating.student)
  ratings: Rating[];

  @OneToMany(() => HostelRating, (hostelRating) => hostelRating.student)
  hostelRatings: HostelRating[];

  @OneToMany(() => Message, (message) => message.student)
  messages: Message[];
}
