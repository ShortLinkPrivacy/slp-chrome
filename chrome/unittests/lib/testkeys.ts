/// <reference path="../../src/modules.d.ts" />

var aliceArmor = "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v2\n\nmQENBFZXkWABCACq46O8VHRMabCpQS97gcNwqfBw0585dqKfOBFZjwSFMtKiXShs\nGXZ5xVTjKTiHgbZdAXcKDIU3sC/ABUIGcUs8LVRBPaJd0UlhwskESVuWIyVTdKwS\n1xcUT8Xg3cX0rLjm8m75WqgZEihVefMIY0F0ayDu2FmxqINs/OopapgKdG1KoKW9\nyqaVdxuKjvm/pMvZdKcEhFbXtHl+4ozDEAEreG0DnSmm/x4ws83pOZyUcKBpAYpN\nQArYANRvLwDt5DOA7CjybSOvFmy5MQ7zTSZV/Rj/ly7zGHPVXEx8rWDuRBUwFpLV\njmwM+y0jprstnvS5CLn5s70cJx7zzUpk3NunABEBAAG0FkFsaWNlIDxhbGljZUBp\nZm54LmNvbT6JATcEEwEIACEFAlZXkWACGwMFCwkIBwIGFQgJCgsCBBYCAwECHgEC\nF4AACgkQpaV+Kz7ml6aTkAf/Revbng+9iFxA7feDT1NoZIRJybTGqAKfy8E7584h\nj73mi3qwyGIJ+52AdlsG7CIpShwmzw3FzjGN8EUia4Hg+ZlywX4VKSl34nXYJ04k\niOIuTaxVfGWjMTVY4TafV55ML0NjrZh5hIy0qFpyDWnOYsoCQZFYdO6OawLzMmEs\njaaI0saQar2CnQktITkfQwi/uc8+xEqHWs+Nf3tl/o876xjtdpKNPdvF2OwzJKgX\na2ZKkmWu4y1W1VX5I7CJdacdzSbdI73p/fInnyOAkrrrN4cjpUJ3r9nY/lU8o1NB\nPUfinMx6ysP3dnUIf88pDFyF+6HieTCqXF5IpyJtVSPGK7kBDQRWV5FgAQgAz+Bu\n5YVMm+ly7zoPN3ab3hwX2+K3jFx8Kbx9RSnn+RJGPQ6Voia4Gam2HOp/G2exd+ZL\nAKRiaJtFvzVYczpO/j7XIOzek6a5bxej2Pvv1Fzsldva3ZiMn8BxijA0/K5Bd7j8\nk3Q0f/YqNpi3e0idJoQd2ztCCRFpdKJM/JMKpKs+/ZODf/qAA7tYAh3V0BiWfFW8\nsKvCDlHF/AAgHADWM8BHrS3E0SN4jn3jZvlcupLVA/C4dqBX5u/FhdSpV9q3PdHC\nyCUbn1KWUACK6+I/jnJ2KRyTF7pi+tC0p6pNRxfxUOItfprqIzRm0mEaWsbpapLO\nbAJbwiaDj+233a3iGwARAQABiQEfBBgBCAAJBQJWV5FgAhsMAAoJEKWlfis+5pem\ns70IAKgu7eW5laY+vAQ4Yhc+JMrWyax68uRl0GaOcbrzFgImljI3m58zcd6hPq16\n27Mzu5rGeGhUR5Vsi2SewaoFyDXCLX+wmjPs99biRGtZhSd6QbvYuoIOd46G56hp\nEnxP7+p0GDqmz5QYMbunWL1U1zYlWvEcKCW29f3f5M7JgBg26cDY9Y4O2PWgwxsS\nV3QYhSW7HSEk24a2KFx3XgbJsUaemkgtKmiHVWHnjgjRHxXsvxj29jGcglFmVIdh\nUFS7QuYjZ6t1P2I10bCnWIZKlyXj2rPOJpTuBWipYYbWvxehoKNl/QKNxYDn7/+j\nYSpe7tgAZOxCUoIIjg4CTcr+s1w=\n=Clod\n-----END PGP PUBLIC KEY BLOCK-----";
var bobArmor = "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v2\n\nmQENBFZXkecBCAC4wZcGE1JS3fjG2cfoN2XO1htPOJ19uAf81KXCWdHWpItQdtcT\nolV2lgHBaPnCPkXl4z72kTs7e0LR1crtLyX3cfIzjs37KHgdUzlhwsC4tqioLm1M\nS8zGRjpyvY24T5Bllp2wy+w7+DIYXZ65kSAUlXhu+jgy/oJlQ0T8rKmqVGOxud4E\nbeNlFkkvY26bX8f9Z7fJJAseTXjU2L/52kA4gdIO7HSceV/tOkEqJT5wF+UaSlhB\nzl5pi3m2putCDYWUGWTCeVQKPTh6aICrXmwalqjnT19WGjT3/t85yoLQPllIYqWI\nqsVxyn3i0xoDRPIGpXj8PPBJhr/E9YqqLN+RABEBAAG0FUJvYiBCLiA8Ym9iQGlm\nbnguY29tPokBNwQTAQgAIQUCVleR5wIbAwULCQgHAgYVCAkKCwIEFgIDAQIeAQIX\ngAAKCRBelrwHW25QkgTDB/9UgkXLOK7+2Hs4BJRf/R+jY02eDUFE9tjbHA2qhXRU\nPG3AQGNoZKK/z6I0Q2kEEGe9t31crgD9tXBqE0EblmEL8zWvFsFkGIocfYSbPG6V\nE3BT1hC8TO6KLjx9jcJwmBr1pFQiYZiWCPgpNxJX+kd+ZQU0vyuRK709NZBFeD58\nBceeIe5KLGSy6fFjflB/8m2eLyzX6DPnaMZglkYcighSwbSxVYkKzOWUFYnP7OGT\nSnOeV1BFLa0DsAHBRjJCg6p8TFb3PzjCxPhel6igkuwiyTabgFpDk9Ljg42ojOli\n6xB/9WI63Op/xZt+XhyY1+9WMLG9OoDWhjSz3x+a59csuQENBFZXkecBCADAQiYS\nQkXAYO1Y2F1yHt/ZlfrJzPy63CylNUWLehYTKJSGGoRLNJLl50ATq++OVwnyvcZV\nL9hBuw0vf8UhTAIRotHiUbTrEuWzAeVIBE9gCVWjy+K/RxBSjpxsgHkrpQaRZUS/\nv1Oww3XZohSu8wW7U+7qmhs63ipdMUf+9aR6VOkK2hDXWUCNaQv/Cf78IZw1lbXK\nezQeJwUsR89LBP6z9JygvHbmELFAIa524/cPI1VgIdTt78uXpI+R5oANYQpzQDFf\n/IgyxJz2FoPG508eNG58iakc8fIfna4CdSmLHHhaRqhHKYNdYvoWhRH8k4iX/WFi\nO5E8tQXnQX5TBMkRABEBAAGJAR8EGAEIAAkFAlZXkecCGwwACgkQXpa8B1tuUJLK\nNQf9Guj/oN46GvAiMSmvzPzEWgMRMMDW73auEmrIZTtXFsXEW6u3CA6OkNqpaEfx\nGYBiteXaHTwL2EzLtZ5kdVgAkojzS7wMdggzysDYs2FrIEU+XpsL6Dv6XnK9ALbt\n2+8w634/e9pLrdckuhxEPxyQRvHE1u3jvQ9cBE4ppTS5N+T+DuOv0P2A7h0hdhPr\n5XyjTITJnrNKYGjk7agaJ5up5FTcjlTPOfQWvMolTY7hIWFcsFAhe1S4e5wcY3iE\nroBKtIho7ipo3hv5PJybPsWT0GMhZ/AKZxVltYtr0JR8u8GRD9tXsQEB4P775DeM\nNgrxgdehEV305VPynmJfuRd79Q==\n=xeB3\n-----END PGP PUBLIC KEY BLOCK-----";
var charlieArmor = "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v2\n\nmQENBFZXkpoBCADx1yrc8OBVmlEE+SYrRN9w954t7zBfiJgpfeO8C5DndG1SnbTo\nkPO4rD7xB8ncJoKDN/FiKcXuvOsZh8InjegKEyH8xAmdrU/GIlucrfJ0htWdvnRW\no1SybxeRNoX7MxCfohv5HP/fjBXFv/ubj5QfhoY8kMSPhzAFnEPklJgNR//Rhnrc\nGMbBMFa+7Aw+fTBoQfRJyXN4TbAVXmTlxw6wJrB7VYaS7vQ3PFueB/h6lo5NQixc\netw0x5B+WHKDfPGge+kHsjV+OIrvCFJqngwxDymHS7j0YnRQFIs0RxYyjOK+9UpJ\nUu63Jy0U4pWbrsMaYY2TYHhizz1ve9sZbwuXABEBAAG0GkNoYXJsaWUgPGNoYXJs\naWVAaWZueC5jb20+iQE3BBMBCAAhBQJWV5KaAhsDBQsJCAcCBhUICQoLAgQWAgMB\nAh4BAheAAAoJEBJyGbcUwsVlUfUIAJ/NpYw7XgDYC3Gg56VCMQeucuan5wzq5a74\nu3IRtnbZ17W/6zBAAwXybt5EWXhvGFIa4oPKcP7VakFCW153HRc+0ymSUYDypCST\nU7Jo6wE08p1wiLzNT0wgDIdKptxVr+GxkOHkAdWWy5daAuxTD4IWYfiqZaMNZF6I\nJ0/EXxVdvg4i/c3gHAK9NTGzrewfYYXbOHml8Kai19grlQwIdxuNQ/iph+BnPM8m\n4n/dNImGLKdDxMAT/toLbg4sDkaZlsDbAfbAb7M3blTK1Un7BrloxXervQMQGH06\n+QilEMMC4n/scIYKXTNG6cE+cEq7HOMqVjxNzd3w8cJ7Ff+O6p25AQ0EVleSmgEI\nAJ0RmFwa1U6r3+ql25vppF5jH3A3heAqurgkm+qiU7ocl02NAfxkKqkzG7PlXGoP\nlpkQk1Hv1UPqgpoCHPux+L3xAiKS/gziDX2XSQJjBK6dwyJcLhUWrmPB2RarJew7\nk7q5fbeLQlA9H5Z90wW8uzmnyqIWD9HD2a6PWLQPhxPct7kG8adYZTK5RajXhPIg\nmOPtmTqZfTf4X0T6sNrgbSiLJvHRzk422vGQmPulELVgxEyCG2STQufPrCfUASGG\neRg1YHVgdS0i/sKlMjAnticS9vsVNoeDolMd2wYZi6Drv6jqGQgOw8Mru24TMp3F\ns4VzBJicu+sp23GUNEbcV6MAEQEAAYkBHwQYAQgACQUCVleSmgIbDAAKCRASchm3\nFMLFZSt5B/wKjEWBVla6Be9ZQqIfsCoo5Fdrn+jJxgysSKTO2dGe4dilAYWzI2C3\nWrs0uUYfSK92sI2jSSs0Vqet00x/XzZdgxCiASK+RlSUJfbYv6kqSdZX8FYzAqxQ\nkFWZKKyHKC6vptX/sqAXRH+/hQdFnBp1Q3+JYVPMzvvO0leSQInwAN30vxMe30hG\nfX+zjU47GhpWyFEJh2f6tzWh6wlQ00B1znXbQzphG+7Iyz+AMrrtsoNPDQLHfiPj\nm4wDRYqWGjEkwEZEioXL0HrF9bM2qTxwwftCcKNDkEGPi9xCZIniaONJd1OKX0zc\nKzqintTUWY8qfu/vwnFGhmMSYUvxdF4W\n=wOc+\n-----END PGP PUBLIC KEY BLOCK-----";

var secretArmor = `
-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v1.2.0
Comment: http://openpgpjs.org

xcFGBFbfYBIBBAC8Wztz8egcWhqJpsNGG2JyZjxX0injOeeLJ7mFSPQuNTn0
AbV0sdE9YB19dUoTl+DTVJ1wx3FDb0IjXaMoCInz5rvsMW7eAxFdJNSn+gzK
lqTl0g/nln/zZ4xQVm2eepf6PZ0Bj70DtMg4czrxABWEzOQ7OE1hn59QNB3M
ZjH1xwARAQAB/gkDCDPIsPG7J0JNYOeDH9wE4spj8NqHEL2ualYFwGkuuo/f
w4UyM2644UwB4TAr8pysUJRd8vbqKwqZhNm4uTGR9tD97+50+YmsJP7ogViI
eOxszQlaX8SS7bZUZmOGfMzP++bf3vy8yVPh9gNkYHt0vcyDeZtdp9k0HC6v
0WaDV8icLScVhn1NQvxqzUT8qbENg4nhp3e9jaS1G0jIUVFCNpw8HqWwLIv1
iZrtIAUrlp2WCqY6O35dSuQ0HDyBZr4JD+13/vCnBvpuwNlBDZzYi44h+NIy
dt+d5YybHOzb6cFAwUofv+BaylhxrHbTvIm0aC+HulIax7TY3TorD/16u7pO
TUrxWAqiwvOe1g7d0slA8t8zcxMfahQT2S74O8t/C/pupygtJxpoxFQpYKUt
TOw8+Ju5Lwshh4pe2cXwHk55qatLZG+f8Ovbg+bZpTRz73cnd96eIGnt+a9/
5ZE9svzOQfk2WouKxiBqTX5V7K5MLD9rTQnNFVN0ZWZhbiA8c2dlQGlmbngu
Y29tPsKyBBABCAAmBQJW32ASBgsJCAcDAgkQ+dKf3umineoEFQgCCgMWAgEC
GwMCHgEAAK17BACWtjnhMvphLr5t637RiCXEJ4tTgBCMRUBj79pFg3d1FOWI
06pbp4U0S9zVU9AtsW7AM1uyB/C8wAdilz09usbDxG82TSc9MpCGfAi7v9bZ
G741nwKT5PODKg6Tl0RdPYu1FTSF68Ryuy2dwEe4fM8Z2fPx37cRkfpR3M41
U8V9XsfBRgRW32ASAQQAq+13rIaCKMYsh3sSy6ZTHoNMjyBF03CiZWEOVkd4
k53268uz7Ww6GAS5zy424/d/NSewdJqf42NYDba/Iv2OH9sOdjY5a0dlDqp7
R0gqmEG6ldlFswJ9ocnmhrdWkVJb8vAayxBuFZJoecNhasqQjUceqelEzLgQ
LNYnQOzoDWMAEQEAAf4JAwg5KA0I3DbI6mAm4f6rMVkfR5zUW6S0Y9ZCPiIW
TCHNEYg9NlOa9TfJtZcw+yYnAC16MyGJZVxI4+uq5kk2a+gqhkfplmAixaxo
hdhFGv1I83A5MTWkxfe4KWkuiZHK07q0KCLyLPcRTe+412myvsRfwKrXrSHJ
1uTvJLjWNZEZ4zX5JTtMw7dy2Htkk6bh/k258AOC3AEeY3mnUCmBrMiL0J0b
muSEGcu0zSN8sVMgiWJ1dqK5AJYVqHuJJ8yLxeefKXNKtjN2LkaQnZEEAyKd
gOMA1IK18FNOCBLUNbRjjsvnwcskGFRn6KAgRAAAsi34Ga/dFllVlU9c+buF
eiPFAieISfO9TdkJXTwuXfH5KsDrAdqUrkY/TLOR+2rB7kawNRZK6zpagVk4
enKGQV0qROGXlVJ1MzlOp4IApGiDBJGX3HSjLCHpXyUEIYM1JxQnjuNKBQFI
pOwRMv3XgjSigdzLh9emK2HrwEzitR+PACJA2mHiwp8EGAEIABMFAlbfYBIJ
EPnSn97pop3qAhsMAADkNgQArwAaPq9cSeeI9989+PraFCmVRgSZWT4f/kxJ
nsjqsTKVXo4YfHGzwW0hz1w6/OYWyVhn275UNse5sTrkNQBB75LzISRPty6h
atSkUf5AQxgT0hi/Os6TY9uu7pADg3qIGXjvLEWYpUr9GhBh2s9PhgQeefsO
F/nl6FGHIXLJ2RQ=
=96dm
-----END PGP PRIVATE KEY BLOCK-----
`;

var stefanArmor = `
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v1.2.0
Comment: http://openpgpjs.org

xo0EVt9gEgEEALxbO3Px6BxaGommw0YbYnJmPFfSKeM554snuYVI9C41OfQB
tXSx0T1gHX11ShOX4NNUnXDHcUNvQiNdoygIifPmu+wxbt4DEV0k1Kf6DMqW
pOXSD+eWf/NnjFBWbZ56l/o9nQGPvQO0yDhzOvEAFYTM5Ds4TWGfn1A0Hcxm
MfXHABEBAAHNFVN0ZWZhbiA8c2dlQGlmbnguY29tPsKyBBABCAAmBQJW32AS
BgsJCAcDAgkQ+dKf3umineoEFQgCCgMWAgECGwMCHgEAAK17BACWtjnhMvph
Lr5t637RiCXEJ4tTgBCMRUBj79pFg3d1FOWI06pbp4U0S9zVU9AtsW7AM1uy
B/C8wAdilz09usbDxG82TSc9MpCGfAi7v9bZG741nwKT5PODKg6Tl0RdPYu1
FTSF68Ryuy2dwEe4fM8Z2fPx37cRkfpR3M41U8V9Xs6NBFbfYBIBBACr7Xes
hoIoxiyHexLLplMeg0yPIEXTcKJlYQ5WR3iTnfbry7PtbDoYBLnPLjbj9381
J7B0mp/jY1gNtr8i/Y4f2w52NjlrR2UOqntHSCqYQbqV2UWzAn2hyeaGt1aR
Ulvy8BrLEG4Vkmh5w2FqypCNRx6p6UTMuBAs1idA7OgNYwARAQABwp8EGAEI
ABMFAlbfYBIJEPnSn97pop3qAhsMAADkNgQArwAaPq9cSeeI9989+PraFCmV
RgSZWT4f/kxJnsjqsTKVXo4YfHGzwW0hz1w6/OYWyVhn275UNse5sTrkNQBB
75LzISRPty6hatSkUf5AQxgT0hi/Os6TY9uu7pADg3qIGXjvLEWYpUr9GhBh
2s9PhgQeefsOF/nl6FGHIXLJ2RQ=
=zJj0
-----END PGP PUBLIC KEY BLOCK-----
`;

module TestKeys {
    export var alice = new Keys.PublicKey(aliceArmor);
    export var bob = new Keys.PublicKey(bobArmor);
    export var charlie = new Keys.PublicKey(charlieArmor);
    export var stefan = new Keys.PublicKey(stefanArmor);
    export var secret = new Keys.PrivateKey(secretArmor);
}
