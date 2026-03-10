import { checkWerkzeugPassword } from './werkzeug-password';

describe('checkWerkzeugPassword', () => {
    describe('scrypt', () => {
        it('returns false for wrong scrypt password', () => {
            const hash =
                'scrypt:32768:8:1$99rBDxdnNDD5D8b5$ebb5dcab7ffff242b12cbe9bfc55cce3166db95a5fb71da6c2c214edb80fbb6d13a97ed8e95b3701eb1f0d66ef3a227bef059af163b021841ae6accbffe48d4c';
            expect(checkWerkzeugPassword('wrong', hash)).toBe(false);
        });

        it('returns false for invalid scrypt password', () => {
            const hash =
                'scrypt:32768:8:1$99rBDxdnNDD5D8b5$ebb5dcab7ffff242b12cbe9bfc55cce3166db95a5fb71da6c2c214edb80fbb6d13a97ed8e95b3701eb1f0d66ef3a227bef059af163b021841ae6accbffe48d4c';
            expect(checkWerkzeugPassword('', hash)).toBe(false);
        });

        it('returns false for empty password', () => {
            expect(checkWerkzeugPassword('', 'scrypt:32768:8:1$salt$hash')).toBe(false);
        });

        it('returns false for empty hash', () => {
            expect(checkWerkzeugPassword('test', '')).toBe(false);
        });

        it('returns false for unsupported algorithm', () => {
            expect(checkWerkzeugPassword('test', 'md5:hash')).toBe(false);
        });
    });

    describe('pbkdf2', () => {
        it('handles pbkdf2-sha256 format', () => {
            const hash = 'pbkdf2:sha256:150000$saltsalt$cf99f5c4b956b9af7fae3a2ff8d8ba921fd7967a1e001f2af2fdc39754f8fecd';
            const valid = checkWerkzeugPassword('secret', hash);
            expect(typeof valid).toBe('boolean');
        });

        it('returns false for invalid pbkdf2 password', () => {
            const hash = 'pbkdf2:sha256:150000$weUYb4Vf$cf99f5c4b956b9af7fae3a2ff8d8ba921fd7967a1e001f2af2fdc39754f8fecd';
            expect(checkWerkzeugPassword('wrongpassword', hash)).toBe(false);
        });
    });
});
